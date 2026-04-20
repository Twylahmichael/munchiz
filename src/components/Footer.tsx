import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="bg-secondary text-primary-foreground py-14">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-4xl font-display text-accent tracking-wider drop-shadow-[2px_2px_0_oklch(0.15_0.02_30)]">
                MUNCHIZ
              </span>
              <span className="text-2xl">🍔</span>
            </div>
            <p className="text-primary-foreground/70 max-w-xs">
              Munch Together, Laugh Forever. Kamulu's loudest fast food spot.
            </p>
          </div>

          <div>
            <h4 className="font-display text-2xl text-accent mb-4">Quick Links</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#menu" className="hover:text-accent transition-colors">Menu</a></li>
              <li><a href="#deals" className="hover:text-accent transition-colors">Deals</a></li>
              <li><a href="#gallery" className="hover:text-accent transition-colors">Gallery</a></li>
              <li><a href="#find-us" className="hover:text-accent transition-colors">Find Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-2xl text-accent mb-4">Get In Touch</h4>
            <div className="flex flex-col gap-3">
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-5 py-3 rounded-full font-bold uppercase text-sm tracking-wide hover:scale-[1.02] transition-transform"
              >
                Order on WhatsApp
              </a>
              <a
                href="https://www.tiktok.com/@munchiz1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-primary-foreground text-secondary px-5 py-3 rounded-full font-bold uppercase text-sm tracking-wide hover:scale-[1.02] transition-transform"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.49a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.42Z" />
                </svg>
                @munchiz1
              </a>
              <a href="tel:+254728466665" className="text-primary-foreground/70 hover:text-accent text-sm text-center">
                0728 466 665
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row gap-3 justify-between items-center text-primary-foreground/60 text-sm">
          <p>© {new Date().getFullYear()} Munchiz. All rights reserved.</p>
          <p>Kamulu, Kangundo Road · Nairobi</p>
        </div>
      </div>
    </footer>
  );
}
