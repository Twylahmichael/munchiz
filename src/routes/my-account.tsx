import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { sanitize } from "@/lib/sanitize";

export const Route = createFileRoute("/my-account")({
  component: MyAccount,
});

function MyAccount() {
  const { user, profile, loading: authLoading, signOut, refetchProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/sign-in", search: { returnTo: "/my-account" } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.default_delivery_address || "");
      setDeliveryNotes(profile.delivery_notes || "");
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: sanitize(fullName),
          phone: sanitize(phone),
          default_delivery_address: sanitize(address) || null,
          delivery_notes: sanitize(deliveryNotes) || null,
        })
        .eq("id", user.id);
      if (updateError) throw updateError;
      refetchProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 pt-24 max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-display text-secondary">My Account</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="acc-name" className="block text-sm font-semibold text-secondary mb-1">Full Name</label>
            <input
              id="acc-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="acc-email" className="block text-sm font-semibold text-secondary mb-1">Email</label>
            <input
              id="acc-email"
              type="email"
              disabled
              value={user.email || ""}
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="acc-phone" className="block text-sm font-semibold text-secondary mb-1">Phone</label>
            <input
              id="acc-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0728 466 665"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="acc-address" className="block text-sm font-semibold text-secondary mb-1">Default Delivery Address</label>
            <input
              id="acc-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kamulu Phase 5"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="acc-notes" className="block text-sm font-semibold text-secondary mb-1">Delivery Notes</label>
            <textarea
              id="acc-notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Near the petrol station, gate is blue"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>
          )}
          {saved && (
            <div className="bg-green-50 text-green-800 text-sm p-3 rounded-xl">Profile saved!</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold uppercase tracking-wide hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="w-full py-3 rounded-full font-bold uppercase tracking-wide text-sm text-destructive border-2 border-destructive hover:bg-destructive hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
