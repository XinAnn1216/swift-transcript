import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in — Video Speed Reader",
  description: "Sign in to Video Speed Reader to manage your transcripts.",
};

export default function SignInPage() {
  return <AuthForm mode="signin" />;
}
