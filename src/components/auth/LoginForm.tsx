"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: "Doctor", email: "dr.amrani@medboard.local", desc: "Full clinical access" },
    { label: "Nurse", email: "n.benali@medboard.local", desc: "Patient care tasks" },
    { label: "Admin", email: "admin@medboard.local", desc: "Platform management" },
    { label: "Read-only", email: "viewer@medboard.local", desc: "View-only access" },
  ];

  return (
    <div className="w-full max-w-[420px] animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
          <span className="text-white text-lg font-bold">M</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1.5">Sign in to MedBoard Operations Platform</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="name@medboard.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      {/* Demo accounts */}
      <div className="mt-10">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400">Demo accounts — password: demo123</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              onClick={() => {
                setEmail(acc.email);
                setPassword("demo123");
                setError("");
              }}
              className="text-left px-3.5 py-3 rounded-lg border border-gray-100 bg-white hover:border-brand-200 hover:bg-brand-50/30 transition-all duration-150 group"
            >
              <span className="text-xs font-semibold text-gray-800 group-hover:text-brand-700 transition-colors">{acc.label}</span>
              <span className="block text-[10px] text-gray-400 mt-0.5">{acc.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
