import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function AdminSiteSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSiteSettings();
  const [businessName, setBusinessName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tagline, setTagline] = useState("");
  const [weekdays, setWeekdays] = useState("");
  const [weekends, setWeekends] = useState("");
  const [note, setNote] = useState("");
  const [locationText, setLocationText] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [minimumOrder, setMinimumOrder] = useState("0");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name);
      setWhatsappNumber(settings.whatsapp_number);
      setPhoneNumber((settings as any).phone_number || "");
      setTagline(settings.tagline);
      const hours = settings.operating_hours as any;
      setWeekdays(hours?.weekdays || "");
      setWeekends(hours?.weekends || "");
      setNote(hours?.note || "");
      setLocationText((settings as any).location_text || "");
      setGoogleMapsUrl((settings as any).google_maps_embed_url || "");
      setInstagramHandle((settings as any).instagram_handle || "");
      setTiktokHandle((settings as any).tiktok_handle || "");
      setDeliveryFee(String((settings as any).delivery_fee || 0));
      setMinimumOrder(String((settings as any).minimum_order_amount || 0));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        business_name: businessName.trim(),
        whatsapp_number: whatsappNumber.trim(),
        phone_number: phoneNumber.trim(),
        tagline: tagline.trim(),
        operating_hours: { weekdays, weekends, note },
        location_text: locationText.trim(),
        google_maps_embed_url: googleMapsUrl.trim(),
        instagram_handle: instagramHandle.trim(),
        tiktok_handle: tiktokHandle.trim(),
        delivery_fee: parseInt(deliveryFee, 10) || 0,
        minimum_order_amount: parseInt(minimumOrder, 10) || 0,
      };
      if (settings) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <div className="text-center py-12 text-white/40">Loading...</div>;

  const inputCls = "w-full px-3 py-2 rounded-lg bg-[#1a1714] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-white">Site Settings</h1>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="max-w-2xl space-y-5">
        <div className="bg-[#242018] rounded-xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">General</h2>
          <div><label className="block text-xs text-white/40 mb-1">Business Name</label><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} /></div>
          <div><label className="block text-xs text-white/40 mb-1">Tagline</label><input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} /></div>
          <div><label className="block text-xs text-white/40 mb-1">Location</label><input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Kamulu, Nairobi" className={inputCls} /></div>
          <div><label className="block text-xs text-white/40 mb-1">Google Maps Embed URL</label><input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} className={inputCls} /></div>
        </div>

        <div className="bg-[#242018] rounded-xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Contact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-xs text-white/40 mb-1">WhatsApp Number</label><input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="254728466665" className={inputCls} /><p className="text-xs text-white/20 mt-1">International format without +</p></div>
            <div><label className="block text-xs text-white/40 mb-1">Phone Number</label><input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0728466665" className={inputCls} /></div>
          </div>
        </div>

        <div className="bg-[#242018] rounded-xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Social Media</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-xs text-white/40 mb-1">Instagram Handle</label><input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="munchiz_ke" className={inputCls} /></div>
            <div><label className="block text-xs text-white/40 mb-1">TikTok Handle</label><input value={tiktokHandle} onChange={(e) => setTiktokHandle(e.target.value)} placeholder="munchiz_ke" className={inputCls} /></div>
          </div>
        </div>

        <div className="bg-[#242018] rounded-xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Operating Hours</h2>
          <div><label className="block text-xs text-white/40 mb-1">Weekdays</label><input value={weekdays} onChange={(e) => setWeekdays(e.target.value)} className={inputCls} /></div>
          <div><label className="block text-xs text-white/40 mb-1">Weekends</label><input value={weekends} onChange={(e) => setWeekends(e.target.value)} className={inputCls} /></div>
          <div><label className="block text-xs text-white/40 mb-1">Note</label><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></div>
        </div>

        <div className="bg-[#242018] rounded-xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Orders</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-xs text-white/40 mb-1">Default Delivery Fee (KES)</label><input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-white/40 mb-1">Minimum Order Amount (KES)</label><input type="number" value={minimumOrder} onChange={(e) => setMinimumOrder(e.target.value)} className={inputCls} /></div>
          </div>
        </div>

        <button type="submit" disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-amber-500 text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors">
          <Save size={16} />
          {saveMutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>

        {saveMutation.isError && (
          <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded-lg">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
          </div>
        )}
      </form>
    </div>
  );
}
