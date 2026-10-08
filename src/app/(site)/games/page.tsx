import type { Metadata } from "next";
import { GamesGrid, JoinCTA } from "@/components/site/Sections";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Games" };

export default function GamesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-32 md:px-6 md:pt-40">
        <SectionHeading
          eyebrow="Our games"
          title="Every game we play, we play together."
          text="Aion is the first title the alliance rallies around, but membership is about the people, not one game. Play what you love and bring it to the alliance."
        />
      </section>
      <GamesGrid full />
      <div className="py-24">
        <JoinCTA />
      </div>
    </>
  );
}
