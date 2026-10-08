import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";
import { isOfficer } from "@/lib/constants";
import { folderHref } from "@/lib/media";
import { ButtonLink } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";
import { ArrowIcon } from "@/components/site/Icons";
import { FolderView, toItems } from "@/components/site/MediaFolders";

export const metadata: Metadata = { title: "Official content · Media" };
export const dynamic = "force-dynamic";

/** The official folder: everything the command posted as Vstroz Alliance. Posts are credited to the alliance, not the officer. */
export default async function AllianceMediaPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  const parent = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
  const [posts, me] = await Promise.all([
    db.mediaPost.findMany({
      where: { approved: true, official: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { postedBy: { select: { displayName: true } } },
    }),
    getCurrentUser(),
  ]);

  // A deep link to a video that lives in another folder goes there instead of silently playing something else.
  if (v && !posts.some((p) => p.id === v)) {
    const elsewhere = await db.mediaPost.findFirst({ where: { id: v, approved: true }, include: { postedBy: { select: { username: true } } } });
    if (elsewhere) redirect(folderHref(elsewhere, v));
  }

  const canPost = !!me && me.status === "APPROVED" && isOfficer(me.role);

  return (
    <FolderView
      eyebrow="Official content"
      title={site.name}
      text="Highlights, announcements, and guides posted by the command on behalf of the whole alliance."
      avatar={
        <span aria-hidden className="shrink-0">
          <LogoMark className="h-20 w-20 drop-shadow-[0_0_20px_rgba(155,77,255,0.5)] md:h-24 md:w-24" title="" />
        </span>
      }
      cta={
        canPost ? (
          <ButtonLink href="/admin/media" variant="secondary">
            Post as {site.name} <ArrowIcon />
          </ButtonLink>
        ) : undefined
      }
      items={toItems(posts, site.name)}
      parent={parent}
      initialId={v}
      emptyText="Official alliance content lands here once the command posts it."
    />
  );
}
