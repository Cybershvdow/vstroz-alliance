import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/auth";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Command center" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOfficer();
  const [pendingApplicants, pendingRoleApps, openVotes, openTable, pendingMedia] = await Promise.all([
    db.user.count({ where: { status: "PENDING" } }),
    db.roleApplication.count({ where: { status: "PENDING" } }),
    db.nomination.count({ where: { status: "OPEN" } }),
    db.dispute.count({ where: { status: "OPEN" } }).then(async (d) => d + (await db.tryoutRequest.count({ where: { status: "PENDING" } }))),
    db.mediaPost.count({ where: { approved: false } }),
  ]);

  const items: NavItem[] = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/applicants", label: "Applicants", badge: pendingApplicants },
    { href: "/admin/members", label: "Members" },
    { href: "/admin/matches", label: "Matches" },
    { href: "/admin/roles", label: "Roles", badge: pendingRoleApps },
    { href: "/admin/ranks", label: "Ranks & votes", badge: openVotes },
    { href: "/admin/table", label: "The Round Table", badge: openTable },
    { href: "/admin/media", label: "Media", badge: pendingMedia },
    { href: "/admin/announcements", label: "Announcements" },
    { href: "/dashboard", label: "Member portal" },
  ];

  return (
    <PortalShell user={user} items={items} area="Command center">
      {children}
    </PortalShell>
  );
}
