import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "PATIENT" || user.role === "READONLY") {
    redirect("/patient-portal");
  }

  redirect("/dashboard");
}
