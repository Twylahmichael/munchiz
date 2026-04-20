import { MapPin, Phone, Clock } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function FindUs() {
  return (
    <section id="find-us" className="py-20 sm:py-28 bg-muted">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-primary/10 text-primary font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full mb-4">
            📍 Pull Up
          </span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-secondary mb-4">
            Find <span className="text-primary">Us</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Come through, say hi, leave full.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-card rounded-3xl p-8 sm:p-10 shadow-card-warm border border-border">
            <div className="space-y-7">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-display text-secondary mb-1">Location</h3>
                  <p className="text-muted-foreground">
                    Kamulu, Kanisani — off Kangundo Road
                    <br />
                    Nairobi, Kenya
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Phone size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-display text-secondary mb-1">Call / Text</h3>
                  <a
                    href="tel:+254728466665"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    0728 466 665
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary text-primary-foreground flex items-center justify-center">
                  <Clock size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-display text-secondary mb-1">Open Daily</h3>
                  <p className="text-muted-foreground">
                    10:00 AM – 11:00 PM
                    <br />
                    Late night vibes on weekends
                  </p>
                </div>
              </div>
            </div>

            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-4 rounded-full font-bold uppercase tracking-wide shadow-card-warm hover:scale-[1.02] transition-transform"
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-card-warm border border-border min-h-[400px]">
            <iframe
              title="Munchiz location on Google Maps"
              src="https://www.google.com/maps?q=Kamulu+Kangundo+Road+Nairobi&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
