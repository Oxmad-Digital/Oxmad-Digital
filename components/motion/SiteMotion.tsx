"use client";

import dynamic from "next/dynamic";

// These controllers render no page content. Separate chunks let the server HTML and
// visible controls hydrate first, while preserving the exact same motion components.
const CustomCursor = dynamic(() => import("@/components/cursor/CustomCursor"), { ssr: false });
const PageTransition = dynamic(() => import("./PageTransition"), { ssr: false });
const SmoothScroll = dynamic(() => import("./SmoothScroll"), { ssr: false });
const MotionScanner = dynamic(() => import("./MotionScanner"), { ssr: false });
const SoundPlayer = dynamic(() => import("@/components/audio/SoundPlayer"), { ssr: false });

export default function SiteMotion() {
  return (
    <>
      <CustomCursor />
      <PageTransition />
      <SmoothScroll />
      <MotionScanner />
      <SoundPlayer />
    </>
  );
}
