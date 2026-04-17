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
    { label: "Doctor", email: "dr.amrani@medboard.local" },
    { label: "Nurse", email: "n.benali@medboard.local" },
    { label: "Admin", email: "admin@medboard.local" },
    { label: "Read-only", email: "viewer@medboard.local" },
  ];

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-lg font-bold">M</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">MedBoard</h1>
        <p className="text-sm text-gray-500 mt-1">Hospital Operations Platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
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
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      {/* Demo credentials */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-2xs text-gray-400 uppercase tracking-wider text-center mb-3">
          Demo accounts (password: demo123)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              onClick={() => {
                setEmail(acc.email);
                setPassword("demo123");
              }}
              className="text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors text-left"
            >
              <span className="font-medium text-gray-700">{acc.label}</span>
              <br />
              <span className="text-2xs text-gray-400 truncate block">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
