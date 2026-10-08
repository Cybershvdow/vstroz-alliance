import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { isOfficer } from "@/lib/constants";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

export const metadata: Metadata = { title: "Member portal" };

/** Every account is a community member and gets the portal. Legion-only pages redirect to /dashboard/legion. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const inLegion = user.status === "APPROVED";

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/legion", label: inLegion ? "Legion" : "Join the legion" },
    { href: "/dashboard/matches", label: "Matches" },
    { href: "/dashboard/roles", label: "Roles" },
    { href: "/dashboard/table", label: "The Round Table" },
    { href: "/dashboard/votes", label: "Rank votes" },
    { href: "/dashboard/media", label: "Post content" },
    { href: "/dashboard/profile", label: "Profile" },
  ];
  if (inLegion && isOfficer(user.role)) items.push({ href: "/admin", label: "Command center" });

  return (
    <PortalShell user={user} items={items} area="Member portal">
      {children}
    </PortalShell>
  );
}
