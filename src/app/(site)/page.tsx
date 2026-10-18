import { Hero, Marquee, Pillars, UpcomingMatches, Milestones, JoinCTA } from "@/components/site/Sections";
import { TeamsGrid, CommunityTiles, LatestContent, Command } from "@/components/site/HomeSections";
import { Activity } from "@/components/site/Activity";
import { Welcome } from "@/components/site/Welcome";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/* Home page order follows the Team Liquid blueprint from the esports-site survey:
   hero → upcoming events → community/join → divisions (teams) → latest content → command → values → history → join CTA */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Welcome />
      {site.showSchedule && <UpcomingMatches />}
      <Activity />
      <CommunityTiles />
      <TeamsGrid />
      <LatestContent />
      <Command />
      <Pillars />
      <Milestones />
      <JoinCTA />
    </>
  );
}
