import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ROLE_LABEL, TIER_LABEL, type Tier, type UserRole } from "@/lib/constants";
import { Avatar, Badge, roleTone } from "@/components/ui";
import { FolderView, toItems } from "@/components/site/MediaFolders";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findFirst({ where: { username, status: "APPROVED" }, select: { displayName: true } });
  return { title: user ? `${user.displayName} · Media` : "Media" };
}

/** One member's folder: only the content they posted themselves (official posts live in the alliance folder). */
export default async function MemberMediaPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { v } = await searchParams;
  const user = await db.user.findFirst({
    where: { username, status: "APPROVED" },
    select: { id: true, username: true, displayName: true, role: true, tier: true, title: true },
  });
  if (!user) notFound();

  const parent = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
  const posts = await db.mediaPost.findMany({
    where: { approved: true, official: false, postedById: user.id },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { postedBy: { select: { displayName: true } } },
  });

  const badges = (
    <>
      {user.role !== "MEMBER" && <Badge tone={roleTone(user.role)}>{ROLE_LABEL[user.role as UserRole]}</Badge>}
      {(user.tier === "ELITE" || user.tier === "VETERAN") && (
        <Badge tone={user.tier === "ELITE" ? "gold" : "accent"}>{TIER_LABEL[user.tier as Tier]}</Badge>
      )}
    </>
  );

  return (
    <FolderView
      eyebrow="Member folder"
      title={user.displayName}
      text={`@${user.username}${user.title ? ` · ${user.title}` : ""}`}
      avatar={<Avatar name={user.displayName} size="lg" tone={roleTone(user.role)} />}
      badges={badges}
      items={toItems(posts)}
      parent={parent}
      initialId={v}
      emptyText={`${user.displayName} hasn't posted anything yet.`}
    />
  );
}
