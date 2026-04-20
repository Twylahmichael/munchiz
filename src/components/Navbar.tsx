import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const links = [
  { href: "#menu", label: "Menu" },
  { href: "#deals", label: "Deals" },
  { href: "#gallery", label: "Gallery" },
  { href: "#find-us", label: "Find Us" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-secondary/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group">
          <span className="text-3xl sm:text-4xl font-display text-accent tracking-wider drop-shadow-[2px_2px_0_oklch(0.15_0.02_30)]">
            MUNCHIZ
          </span>
          <span className="text-xl animate-wiggle">🍔</span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-primary-foreground font-semibold uppercase text-sm tracking-wide hover:text-accent transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-accent-foreground px-5 py-2 rounded-full font-bold uppercase text-sm tracking-wide hover:scale-105 transition-transform shadow-card-warm"
            >
              Order Now
            </a>
          </li>
        </ul>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-primary-foreground p-2"
          aria-label="Toggle menu"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-secondary border-t border-secondary-foreground/10">
          <ul className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block text-primary-foreground font-semibold uppercase tracking-wide py-2"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-accent text-accent-foreground px-5 py-3 rounded-full font-bold uppercase text-center"
              >
                Order Now
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
