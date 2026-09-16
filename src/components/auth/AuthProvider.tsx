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
  configured: boolean;
  role: UserRole | "anonymous";
  status: MemberStatus | "none";
  isAdmin: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = Boolean(getBrowserClient());

  const loadProfile = useCallback(async (userId: string) => {
    const client = getBrowserClient();
    if (!client) return;
    const { data } = await client
      .from("profiles")
      .select("*, badges:member_badges(*)")
      .eq("id", userId)
      .single();
    setProfile((data as ProfileRow | null) ?? null);
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

    const init = async () => {
      const client = getBrowserClient();
      if (!active) return;
      if (!client) {
        setLoading(false);
        return;
      }

      const { data } = await client.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user.id) {
        void loadProfile(data.session.user.id);
      }

      const { data: sub } = client.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user.id) {
          void loadProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
      });
      unsubscribe = sub.subscription.unsubscribe;
    };

    void init();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [loadProfile]);

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
      configured,
      role,
      status,
      isAdmin: role === "admin" || role === "super_admin",
      isApproved: status === "approved",
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      changePassword,
      sendPasswordReset,
    };
  }, [user, session, profile, loading, configured, signIn, signUp, signOut, refreshProfile, updateProfile, changePassword, sendPasswordReset]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}