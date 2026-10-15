/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  // The Supabase URL and publishable key are browser-safe. Fall back to the
  // M0 VITE_* names, then to this project's values, so the deploy works before
  // NEXT_PUBLIC_* variables are added in Vercel.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      "https://eqxluaetmggmzxuoxufb.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_keJgcBLUIJDbTBxxKtPjwA_-8e1KY1G",
  },
  // M0 used /signin and /signup; keep old links working.
  async redirects() {
    return [
      { source: "/signin", destination: "/sign-in", permanent: true },
      { source: "/signup", destination: "/sign-up", permanent: true },
    ];
  },
};
export default nextConfig;
