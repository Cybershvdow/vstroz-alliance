import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

/* Link preview card shown when the site is pasted into Discord, X, iMessage, etc. */
export const alt = `${site.name} — ${site.motto}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/logo-original.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "radial-gradient(60% 60% at 75% 20%, rgba(255,90,31,0.28), transparent 70%), linear-gradient(135deg, #0c0a09 0%, #080706 100%)",
          color: "#f3ede4",
          fontFamily: "Georgia, serif",
          padding: 72,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={300} height={300} style={{ borderRadius: 48, boxShadow: "0 0 80px rgba(255,90,31,0.35)" }} alt="" />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 64 }}>
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#e6b95a", textTransform: "uppercase" }}>Vstroz Alliance</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginTop: 16, textTransform: "uppercase" }}>
            <span>One banner.</span>
            <span style={{ color: "#e6b95a" }}>Every world.</span>
          </div>
          <div style={{ fontSize: 26, color: "#a89f92", marginTop: 24, maxWidth: 640 }}>Competitive multi-game alliance. Adults only. Aion 2 is where we start.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
