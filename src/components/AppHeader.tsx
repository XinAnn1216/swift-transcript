import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/SignOutButton";

// Header for signed-in pages.
export function AppHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/app" className="text-lg font-bold tracking-tight">Video Speed Reader</Link>
      <nav className="flex items-center gap-3">
        <Link href="/upload" className={buttonVariants({})}>Upload / 上傳影片</Link>
        <SignOutButton />
      </nav>
    </header>
  );
}
