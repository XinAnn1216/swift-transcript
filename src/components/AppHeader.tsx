import Link from "next/link";
import { Coins } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

// Header for signed-in pages, with the user's credit balance.
export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("credits_balance").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
      <Link href="/app" className="text-lg font-bold tracking-tight">Video Speed Reader</Link>
      <nav className="flex flex-wrap items-center gap-3">
        {user && (
          <Link
            href="/credits"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
            title="Buy more credits"
          >
            <Coins className="h-4 w-4 text-ochre" />
            Credits: {Number(profile?.credits_balance ?? 0)}
            <span className="text-primary">· Buy more</span>
          </Link>
        )}
        <Link href="/upload" className={buttonVariants({})}>Upload / 上傳影片</Link>
        <SignOutButton />
      </nav>
    </header>
  );
}
