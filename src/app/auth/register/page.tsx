"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4 py-8">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-sm w-full shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-sm font-extrabold">
            KS
          </div>
          <span className="text-base font-bold text-navy">KlagonStars</span>
        </Link>
        <h1 className="text-lg font-extrabold text-navy text-center mb-1">Create your account</h1>
        <p className="text-sm text-gray text-center mb-6">Join KlagonStars — free, always</p>
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Full name</label>
              <input className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent" placeholder="Ama" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Phone</label>
              <input className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent" placeholder="0244 000 000" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Email</label>
            <input type="email" className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent" placeholder="ama@email.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Password</label>
            <input type="password" className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent" placeholder="At least 8 characters" />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors font-sans"
          >
            Create Account
          </button>
        </form>
        <p className="text-center text-xs text-gray mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
