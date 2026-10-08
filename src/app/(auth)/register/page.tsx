import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Apply to join" };

export default function RegisterPage() {
  return (
    <div>
      <p className="eyebrow">Recruitment</p>
      <h1 className="display mt-3 text-4xl">Apply to join</h1>
      <p className="mt-3 text-muted">
        Create your account and submit your application. An officer reviews it and unlocks the member portal when you are
        accepted.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
