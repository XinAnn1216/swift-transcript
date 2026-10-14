import { AuthForm } from "@/components/AuthForm";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function SignUp() {
  usePageMeta(
    "Sign up — Video Speed Reader",
    "Create a Video Speed Reader account and get transcripts in three minutes.",
  );
  return <AuthForm mode="signup" />;
}
