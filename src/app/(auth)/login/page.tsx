import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div>
      <p className="eyebrow">Members</p>
      <h1 className="display mt-3 text-4xl">Sign in</h1>
      <p className="mt-3 text-muted">Access match signups, role applications, and alliance announcements.</p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
