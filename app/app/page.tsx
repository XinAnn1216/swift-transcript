import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppView from "@/views/AppView";

export const metadata: Metadata = {
  title: "Dashboard — Video Speed Reader",
  description: "Your Video Speed Reader dashboard.",
};

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return <AppView email={user.email ?? ""} />;
}
