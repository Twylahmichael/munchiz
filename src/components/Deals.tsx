import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Deal = {
  title: string;
  subtitle: string;
  price: string;
  day: string;
  emoji: string;
  variant: "primary" | "accent" | "dark";
};

const deals: Deal[] = [
  {
    day: "Every Thursday",
    title: "Two Piece Thursdayz",
    subtitle: "2pc chicken + fries + soda. The plug.",
    price: "KES 550",
    emoji: "🍗",
    variant: "primary",
  },
  {
    day: "Weekend Special",
    title: "Meat Lovers Pizza",
    subtitle: "Large pizza loaded with all the meats. Free soda.",
    price: "KES 1,200",
    emoji: "🍕",
    variant: "accent",
  },
  {
    day: "Daily Combo",
    title: "Burger + Fries Combo",
    subtitle: "Classic burger, fries & a cold drink. Hits every time.",
    price: "KES 700",
    emoji: "🍔",
    variant: "dark",
  },
];

const variantClasses: Record<Deal["variant"], string> = {
  primary: "bg-gradient-deal text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  dark: "bg-secondary text-primary-foreground",
};

export function Deals() {
  return (
    <section id="deals" className="py-20 sm:py-28 bg-secondary relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-14">
          <span className="inline-block bg-accent/20 text-accent font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full mb-4">
            ⚡ Hot Deals
          </span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-primary-foreground mb-4">
            Weekly <span className="text-accent">Bangers</span>
          </h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto">
            Bigger plates. Smaller prices. Don't miss a deal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {deals.map((deal) => (
            <div
              key={deal.title}
              className={`relative rounded-3xl p-8 ${variantClasses[deal.variant]} shadow-deal hover:scale-[1.03] transition-transform duration-300 overflow-hidden`}
            >
              <div className="absolute -top-6 -right-6 text-9xl opacity-20">
                {deal.emoji}
              </div>
              <span className="inline-block bg-black/20 text-current text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                {deal.day}
              </span>
              <h3 className="text-4xl sm:text-5xl font-display mb-3 leading-tight relative">
                {deal.title}
              </h3>
              <p className="opacity-90 mb-6 relative">{deal.subtitle}</p>
              <div className="flex items-center justify-between relative">
                <span className="text-3xl font-display">{deal.price}</span>
                <a
                  href={buildWhatsAppUrl(deal.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/30 backdrop-blur-sm text-current border-2 border-current/50 px-5 py-2 rounded-full font-bold uppercase text-sm tracking-wide hover:bg-black/50 transition-colors"
                >
                  Grab It
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
