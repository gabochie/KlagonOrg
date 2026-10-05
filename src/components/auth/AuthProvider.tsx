"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Database, UserRole, MemberStatus } from "@/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ProfilePatch = Partial<
  Pick<
    ProfileRow,
    | "full_name"
    | "phone"
    | "age"
    | "gender"
    | "occupation"
    | "interests"
    | "career_goal"
  >
>;

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  age?: number | null;
  gender?: "male" | "female" | "other" | null;
  occupation?: string | null;
  interests?: string[];
  careerGoal?: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  /**
   * True once the initial session lookup has settled AND the profile row has
   * been fetched (or determined not to exist). `isAdmin` is derived from
   * profile.role, so role checks are only meaningful after this flips —
   * otherwise a hard refresh briefly reports isAdmin === false and route
   * guards bounce the user out of admin pages mid-load.
   */
  profileLoaded: boolean;
  /**
   * Set when every attempt to read the session failed. Distinguishes "we could
   * not reach sign-in" from "this visitor is signed out", so a network blip
   * stops looking like a logout.
   */
  initError: string | null;
  /** Re-runs the session handshake after a failure. */
  retryAuth: () => void;
  configured: boolean;
  role: UserRole | "anonymous";
  status: MemberStatus | "none";
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; profile: ProfileRow | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<{ error: string | null }>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * `getSession()` waits on a storage lock and can stall indefinitely on a slow,
 * throttled or blocked connection — and a hung request never rejects. So each
 * attempt is raced against its own deadline, and a miss is retried rather than
 * quietly treated as "signed out", which would bounce a signed-in member to the
 * login page over one dropped packet.
 */
const AUTH_ATTEMPT_TIMEOUT_MS = 6000;

/** Wait before each retry after the first. Three attempts total, then we surface an error. */
const AUTH_RETRY_DELAYS_MS = [900, 2600];

/**
 * Races `promise` against `ms`. Rejects with `label` if the promise has not
 * settled in time, which is the only way to bound a request that hangs instead
 * of failing.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const configured = Boolean(getBrowserClient());

  /**
   * Re-runs the handshake after a failure. Bumping `attempt` re-keys the init
   * effect; clearing the error stops the guards from rendering a stale failure
   * next to freshly loaded state.
   */
  const retryAuth = useCallback(() => {
    setInitError(null);
    setLoading(true);
    setProfileLoaded(false);
    setAttempt((n) => n + 1);
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const client = getBrowserClient();
    if (!client) return;
    try {
      const { data } = await client
        .from("profiles")
        .select("*, badges:member_badges(*)")
        .eq("id", userId)
        .single();
      setProfile((data as ProfileRow | null) ?? null);
    } catch {
      // A profile read that rejects must not abort the handshake. Letting it
      // throw skipped every `setLoading(false)` below, which stranded the whole
      // app on the session spinner — no retry, no error, no way forward.
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const client = getBrowserClient();
    if (!client) return;
    const { data } = await client.auth.getSession();
    const userId = data.session?.user.id;
    if (userId) await loadProfile(userId);
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;
    const retries: ReturnType<typeof setTimeout>[] = [];

    const scheduleRetry = (fn: () => void, ms: number) => {
      retries.push(setTimeout(fn, ms));
    };
    const clearRetries = () => {
      retries.splice(0).forEach(clearTimeout);
    };

    /** The handshake finished — with a session, or with a genuine "no session". */
    const settle = () => {
      if (!active) return;
      clearRetries();
      setInitError(null);
      setLoading(false);
      setProfileLoaded(true);
    };

    /**
     * Every attempt failed. Say so instead of leaving `user` null, which the
     * guards would read as a signed-out visitor and answer with a redirect to
     * login — blaming the member for a connection that dropped.
     */
    const fail = (reason: string) => {
      if (!active) return;
      clearRetries();
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      setProfileLoaded(true);
      setInitError(reason);
    };

    const runAttempt = async (index: number) => {
      const client = getBrowserClient();
      if (!active) return;
      if (!client) {
        settle();
        return;
      }

      // A retry re-enters this function, so retire the previous attempt's
      // listener before taking out a new one. Otherwise the assignment at the
      // bottom of this block just overwrites it, and every failed attempt
      // leaves a Supabase auth listener subscribed for the life of the page.
      unsubscribe?.();

      // Subscribe before the first await. Registering it afterwards meant any
      // throw below skipped it entirely, leaving the app with no auth listener
      // and no chance of picking up a later sign-in.
      const { data: sub } = client.auth.onAuthStateChange((_event, currentSession) => {
        // Hop out of the callback before awaiting anything: this handler runs
        // while the auth client holds its internal lock, and awaiting another
        // Supabase call inside it deadlocks that lock. Deliberately not tracked
        // in `retries`, since clearing those would cancel real state updates.
        setTimeout(() => {
          void (async () => {
            if (!active) return;
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user.id) {
              await loadProfile(currentSession.user.id);
              if (!active) return;
              setProfileLoaded(true);
            } else {
              setProfile(null);
              setProfileLoaded(true);
            }
          })();
        }, 0);
      });
      unsubscribe = sub.subscription.unsubscribe;

      try {
        const { data } = await withTimeout(
          client.auth.getSession(),
          AUTH_ATTEMPT_TIMEOUT_MS,
          "Session lookup"
        );
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        // Await the profile before declaring the session settled: role checks
        // (isAdmin/isSuperAdmin) are meaningless until it lands. loadProfile
        // swallows its own failures, so a missing row degrades to a null
        // profile instead of sinking the whole handshake.
        if (data.session?.user.id) {
          await loadProfile(data.session.user.id);
        }
        settle();
      } catch (err) {
        if (!active) return;
        const delay = AUTH_RETRY_DELAYS_MS[index];
        if (delay === undefined) {
          fail(
            err instanceof Error && err.message.includes("timed out")
              ? "We couldn't reach the sign-in service. Check your connection and try again."
              : "We couldn't check your sign-in status. Check your connection and try again."
          );
          return;
        }
        scheduleRetry(() => void runAttempt(index + 1), delay);
      }
    };

    void runAttempt(0);

    return () => {
      active = false;
      clearRetries();
      unsubscribe?.();
    };
  }, [loadProfile, attempt]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = getBrowserClient();
      if (!client) {
        return { error: "Auth is not configured yet. Add Supabase keys to continue.", profile: null };
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message, profile: null };

      const userId = data.user?.id;
      let signedInProfile: ProfileRow | null = null;
      if (userId) {
        const { data: p } = await client
          .from("profiles")
          .select("*, badges:member_badges(*)")
          .eq("id", userId)
          .single();
        signedInProfile = (p as ProfileRow | null) ?? null;
        if (signedInProfile) setProfile(signedInProfile);
      }
      setProfileLoaded(true);
      return { error: null, profile: signedInProfile };
    },
    []
  );

  const signUp = useCallback(async (data: SignUpData) => {
    const client = getBrowserClient();
    if (!client) return { error: "Auth is not configured yet. Add Supabase keys to continue." };

    const { data: signUpData, error } = await client.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        },
        emailRedirectTo: undefined,
      },
    });

    if (error) return { error: error.message };
    const userId = signUpData.user?.id;
    if (!userId) return { error: "Signup failed. Please try again." };

    await client
      .from("profiles")
      .update({
        age: data.age ?? null,
        gender: data.gender ?? null,
        occupation: data.occupation ?? null,
        interests: data.interests ?? [],
        career_goal: data.careerGoal ?? null,
      })
      .eq("id", userId);

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    const client = getBrowserClient();
    if (client) await client.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      const client = getBrowserClient();
      if (!client) return { error: "Supabase is not configured yet." };
      const { data } = await client.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return { error: "You need to be signed in." };
      const { error } = await client
        .from("profiles")
        .update(patch)
        .eq("id", userId);
      if (error) return { error: error.message };
      await refreshProfile();
      return { error: null };
    },
    [refreshProfile],
  );

  const changePassword = useCallback(async (newPassword: string) => {
    const client = getBrowserClient();
    if (!client) return { error: "Supabase is not configured yet." };
    const { error } = await client.auth.updateUser({ password: newPassword });
    return { error: error ? error.message : null };
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const client = getBrowserClient();
    if (!client) return { error: "Supabase is not configured yet." };
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    return { error: error ? error.message : null };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = (profile?.role ?? "anonymous") as UserRole | "anonymous";
    const status = (profile?.status ?? "none") as MemberStatus | "none";
    return {
      user,
      session,
      profile,
      loading,
      profileLoaded,
      initError,
      retryAuth,
      configured,
      role,
      status,
      isAdmin: role === "admin" || role === "super_admin",
      isSuperAdmin: role === "super_admin",
      isApproved: status === "approved",
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      changePassword,
      sendPasswordReset,
    };
  }, [user, session, profile, loading, profileLoaded, initError, retryAuth, configured, signIn, signUp, signOut, refreshProfile, updateProfile, changePassword, sendPasswordReset]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}