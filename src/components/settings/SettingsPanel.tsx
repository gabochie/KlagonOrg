"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CheckCircle2, KeyRound, Save, UserRound } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent bg-white";
const labelCls = "text-xs font-bold text-navy mb-1.5 block";

export function SettingsPanel() {
  const { user, profile, loading, updateProfile, changePassword } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [interests, setInterests] = useState("");
  const [careerGoal, setCareerGoal] = useState("");

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [profileBusy, setProfileBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setAge(profile.age != null ? String(profile.age) : "");
    setGender(profile.gender ?? "");
    setOccupation(profile.occupation ?? "");
    setInterests((profile.interests ?? []).join(", "));
    setCareerGoal(profile.career_goal ?? "");
  }, [profile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    const ageNum = age.trim() ? Number(age) : null;
    const result = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      age: ageNum && Number.isFinite(ageNum) ? Math.round(ageNum) : null,
      gender: (gender as "male" | "female" | "other" | null) || null,
      occupation: occupation.trim() || null,
      interests: interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      career_goal: careerGoal.trim() || null,
    });
    setProfileBusy(false);
    if (result.error) setProfileMsg({ ok: false, text: result.error });
    else setProfileMsg({ ok: true, text: "Profile updated 🎉" });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      return setPwMsg({ ok: false, text: "Password must be at least 8 characters." });
    }
    if (newPassword !== confirmPassword) {
      return setPwMsg({ ok: false, text: "Passwords don't match." });
    }
    setPwBusy(true);
    setPwMsg(null);
    const result = await changePassword(newPassword);
    setPwBusy(false);
    if (result.error) {
      setPwMsg({ ok: false, text: result.error });
    } else {
      setPwMsg({
        ok: true,
        text: "Password updated. Use your new password next time you sign in.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="relative flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy opacity-30" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-navy" />
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-extrabold text-navy">Settings</h1>
        <p className="text-xs text-gray mt-1">
          Signed in as <span className="font-bold text-navy">{user?.email}</span>
        </p>
      </div>

      {/* Profile */}
      <form onSubmit={(e) => void handleProfileSave(e)} className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserRound size="18" className="text-amber-strong" />
          <h2 className="text-sm font-extrabold text-navy">Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className={labelCls}>Full name</label>
            <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Age</label>
            <input type="number" min={0} className={inputCls} value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Gender</label>
            <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Occupation</label>
            <input className={inputCls} value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Student, Freelance, Job hunting" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Interests</label>
            <input className={inputCls} value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Comma-separated, e.g. Coding, Design, Business" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Career goal</label>
            <input className={inputCls} value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} placeholder="What are you working toward?" />
          </div>
        </div>
        {profileMsg && (
          <p className={`mt-3 text-xs font-bold ${profileMsg.ok ? "text-green-600" : "text-red"}`}>
            {profileMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={profileBusy}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-sans"
        >
          <Save size="15" /> {profileBusy ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={(e) => void handlePasswordChange(e)} className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size="18" className="text-amber-strong" />
          <h2 className="text-sm font-extrabold text-navy">Change password</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        {pwMsg && (
          <p className={`mt-3 text-xs font-bold ${pwMsg.ok ? "text-green-600" : "text-red"}`}>
            {pwMsg.ok && <CheckCircle2 size="13" className="inline mr-1" />}
            {pwMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={pwBusy}
          className="mt-4 px-4 py-2.5 rounded-xl bg-amber text-navy text-sm font-extrabold hover:bg-amber-strong hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-sans"
        >
          {pwBusy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}