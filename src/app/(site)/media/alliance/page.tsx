import type { Metadata } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { LogoMark } from "@/components/brand/Logo";
import { FolderView, toItems } from "@/components/site/MediaFolders";

export const metadata: Metadata = { title: `${site.name} content` };
export const dynamic = "force-dynamic";

/** The official folder: everything the command posted as Vstroz Alliance. */
export default async function AllianceMediaPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  const parent = new URL(process.env.APP_URL || "http://localhost:3000").hostname;
  const posts = await db.mediaPost.findMany({
    where: { approved: true, official: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { postedBy: { select: { displayName: true } } },
  });

  return (
    <FolderView
      eyebrow="Official content"
      title={site.name}
      text="Highlights, announcements, and guides posted by the command on behalf of the whole alliance."
      avatar={<LogoMark className="h-20 w-20 shrink-0 drop-shadow-[0_0_20px_rgba(155,77,255,0.5)] md:h-24 md:w-24" />}
      items={toItems(posts)}
      parent={parent}
      initialId={v}
      emptyText="Official alliance content lands here once the command posts it."
    />
  );
}
