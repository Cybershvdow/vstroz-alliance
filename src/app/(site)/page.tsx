import { Hero, Marquee, Pillars, UpcomingMatches, Milestones, JoinCTA } from "@/components/site/Sections";
import { TeamsGrid, CommunityTiles, LatestContent, Command } from "@/components/site/HomeSections";

export const dynamic = "force-dynamic";

/* Home page order follows the Team Liquid blueprint from the esports-site survey:
   hero → upcoming events → community/join → divisions (teams) → latest content → command → values → history → join CTA */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <UpcomingMatches />
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
