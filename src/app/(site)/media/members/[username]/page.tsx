import { redirect } from "next/navigation";

/** Member folders moved into public profiles. Keep old links working. */
export default async function LegacyMemberFolder({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { username } = await params;
  const { v } = await searchParams;
  redirect(`/members/${encodeURIComponent(username)}${v ? `?v=${encodeURIComponent(v)}` : ""}`);
}
