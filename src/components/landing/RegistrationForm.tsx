"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { INTERESTS } from "@/lib/constants";

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  age: string;
  occupation: string;
  gender: string;
  careerGoal: string;
};

const GENDER_OPTIONS = [
  { value: "", label: "Select" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
] as const;

export function RegistrationForm() {
  const [interests, setInterests] = useState<Set<string>>(new Set(["Technology"]));
  const [formData, setFormData] = useState<FormData>({
    fullName: "", phone: "", email: "", age: "", occupation: "", gender: "", careerGoal: "",
  });

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) next.delete(interest);
      else next.add(interest);
      return next;
    });
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="bg-navy relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(245,158,11,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 relative z-10">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Join KlagonOrg — Free
          </div>
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-white tracking-tight leading-tight mb-2">
            Your future starts here,<br />right in Klagon.
          </h2>
          <p className="text-white/60 text-sm">
            It takes 2 minutes. No fees. No forms. Just your information and your ambition.
          </p>
        </div>
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 sm:p-10 relative z-10">
          <div className="text-xl font-extrabold text-navy tracking-tight mb-1">
            Create your KlagonOrg account
          </div>
          <div className="text-sm text-gray mb-6">Free membership — instant access, no waiting</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input
              label="Full name"
              placeholder="Ama Mensah"
              value={formData.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="0244 000 000"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="ama@email.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
            <Input
              label="Age"
              type="number"
              placeholder="22"
              value={formData.age}
              onChange={(e) => updateField("age", e.target.value)}
            />
            <Input
              label="Occupation"
              placeholder="Student / Employed / Other"
              value={formData.occupation}
              onChange={(e) => updateField("occupation", e.target.value)}
            />
            <Select
              label="Gender"
              options={[...GENDER_OPTIONS]}
              value={formData.gender}
              onChange={(e) => updateField("gender", e.target.value)}
            />
            <div className="col-span-2">
              <Input
                label="Your career goal"
                placeholder="What do you want to achieve in the next 2 years?"
                value={formData.careerGoal}
                onChange={(e) => updateField("careerGoal", e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs font-semibold text-navy mb-2">
            Your interests (pick all that apply)
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
                  interests.has(interest)
                    ? "bg-navy text-white border-navy"
                    : "bg-white text-gray border-border hover:border-navy"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
          <Link href="/auth/register">
            <Button variant="dark" size="lg" className="w-full">
              Create Free Account →
            </Button>
          </Link>
          <p className="text-center text-xs text-gray mt-3">
            Instant access. 100% free, always.
          </p>
        </div>
      </div>
    </section>
  );
}
