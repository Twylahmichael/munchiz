import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/sign-in")({
  component: SignIn,
});

function SignIn() {
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  if (user) {
    navigate({ to: "/" });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      navigate({ to: returnTo || "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-display text-accent tracking-wider">
            MUNCHIZ
          </Link>
          <p className="text-muted-foreground mt-2">
            {showReset ? "Reset your password" : "Sign in to your account"}
          </p>
        </div>

        {showReset ? (
          <form onSubmit={handleReset} className="space-y-4">
            {resetSent ? (
              <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm text-center">
                Check your email for a password reset link.
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-semibold text-secondary mb-1">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wide hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setShowReset(false); setResetSent(false); setError(null); }}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-semibold text-secondary mb-1">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="block text-sm font-semibold text-secondary mb-1">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wide hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setShowReset(true); setError(null); }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
              <Link to="/sign-up" className="text-primary font-semibold hover:underline">
                Create account
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
