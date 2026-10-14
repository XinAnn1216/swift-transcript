import { AuthForm } from "@/components/AuthForm";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function SignIn() {
  usePageMeta(
    "Sign in — Video Speed Reader",
    "Sign in to Video Speed Reader to manage your transcripts.",
  );
  return <AuthForm mode="signin" />;
}
