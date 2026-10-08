import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="bg-grid absolute inset-0 opacity-50" />
      <div className="relative">
        <LogoMark className="mx-auto h-24 w-24 opacity-80" />
        <p className="eyebrow mt-8">404</p>
        <h1 className="display mt-3 text-4xl md:text-5xl">Lost in the Abyss</h1>
        <p className="mt-4 text-muted">That page doesn&apos;t exist or was moved.</p>
        <Link href="/" className="cut-sm mt-8 inline-block bg-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          Back to base
        </Link>
      </div>
    </div>
  );
}
