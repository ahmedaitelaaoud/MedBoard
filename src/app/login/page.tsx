import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — MedBoard",
  description: "Sign in to MedBoard Hospital Operations Platform",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-[420px] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <div>
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3">
              <span className="text-white text-lg font-bold">M</span>
            </div>
            <p className="text-sm font-medium text-white/60">MedBoard</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold leading-snug">
              Hospital Operations<br />Platform
            </h2>
            <p className="text-sm text-white/60 mt-3 leading-relaxed">
              Real-time ward visibility, patient records, and clinical task management in one place.
            </p>
          </div>
          <p className="text-xs text-white/30">v0.1 — Prototype Demo</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <LoginForm />
      </div>
    </div>
  );
}
