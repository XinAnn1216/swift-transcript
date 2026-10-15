import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign up — Video Speed Reader",
  description: "Create a Video Speed Reader account and get transcripts in three minutes.",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
