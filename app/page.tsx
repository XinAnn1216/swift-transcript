import type { Metadata } from "next";
import Index from "@/views/Index";

export const metadata: Metadata = {
  title: "Video Speed Reader — 三分鐘拿到逐字稿",
  description: "Upload your video, get a clean transcript in three minutes. Powered by OpenAI Whisper.",
  openGraph: {
    title: "Video Speed Reader — 三分鐘拿到逐字稿",
    description: "Upload your video, get a clean transcript in three minutes.",
  },
};

export default function Page() {
  return <Index />;
}
