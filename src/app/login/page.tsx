import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — MedBoard",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <LoginForm />
    </div>
  );
}
