import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { PasswordInput } from "@/components/PasswordInput";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display text-primary tracking-wider">MUNCHIZ</h1>
          <p className="text-muted-foreground mt-1">Set your new password</p>
        </div>

        {success ? (
          <div className="bg-card rounded-2xl p-8 shadow-sm border border-border text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-secondary mb-2">Password Updated</h2>
            <p className="text-muted-foreground text-sm mb-6">Your password has been successfully changed.</p>
            <Link
              to="/sign-in"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm hover:bg-secondary transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-sm border border-border space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">New Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Confirm Password</label>
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Re-enter password"
              />
            </div>
            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
