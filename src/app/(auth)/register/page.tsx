import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <div>
      <p className="eyebrow">Recruitment · Step 1 of 2</p>
      <h1 className="display mt-3 text-4xl">Create your account</h1>
      <p className="mt-3 text-muted">
        Pick a username and password. Next you fill in your player profile from inside your account: the game you play,
        your in-game name, and how you play. An officer reviews it and unlocks the member portal.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
