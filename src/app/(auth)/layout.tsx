import Link from "next/link";
import { Logo, LogoFull } from "@/components/brand/Logo";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-bg-2 lg:block">
        <div className="bg-rays absolute inset-0" />
        <div className="bg-glow-accent ember absolute inset-0" />
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/">
            <Logo />
          </Link>
          <div>
            <LogoFull className="h-64 w-64 drop-shadow-[0_0_40px_rgba(255,90,31,0.35)]" />
            <h2 className="display mt-8 text-4xl xl:text-5xl">
              {site.motto.split(" ").slice(0, 2).join(" ")}
              <br />
              <span className="display-gold">{site.motto.split(" ").slice(2).join(" ")}</span>
            </h2>
            <p className="mt-4 max-w-md text-muted">{site.tagline}</p>
          </div>
          <p className="text-xs text-dim">Applications are reviewed by an officer, usually within 48 hours.</p>
        </div>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-4 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-12 md:px-10">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
