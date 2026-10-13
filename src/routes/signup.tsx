import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Video Speed Reader" },
      { name: "description", content: "Create a Video Speed Reader account and get transcripts in three minutes." },
      { property: "og:title", content: "Sign up — Video Speed Reader" },
      { property: "og:description", content: "Create a Video Speed Reader account and get transcripts in three minutes." },
    ],
  }),
  component: () => <AuthForm mode="signup" />,
});
