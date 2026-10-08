import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Join the community" };

export default function RegisterPage() {
  return (
    <div>
      <p className="eyebrow">Recruitment · Your account</p>
      <h1 className="display mt-3 text-4xl">Join the community</h1>
      <p className="mt-3 text-muted">
        Create your Vstroz Alliance account and you are in the community. Joining the Aion legion is a separate step from inside
        your account: fill in your player profile and apply.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
