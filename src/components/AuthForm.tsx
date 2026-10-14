import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) navigate("/app");
    else setError("Please check your email to confirm your account.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="mb-8 block text-center text-lg font-bold tracking-tight">
          Video Speed Reader
        </Link>
        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-8 shadow-glow">
          <div>
            <h1 className="text-2xl font-semibold">{isSignUp ? "建立帳號 Sign up" : "登入 Sign in"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp ? "Create your account with email and password." : "Welcome back."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : isSignUp ? "Sign up" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>Already have an account? <Link to="/signin" className="text-primary hover:underline">Sign in</Link></>
            ) : (
              <>No account yet? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
