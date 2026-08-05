import { useDeals } from "@/hooks/use-deals";
import { useCart } from "@/lib/cart";

const VARIANT_CLASSES = [
  "bg-gradient-deal text-primary-foreground",
  "bg-accent text-accent-foreground",
  "bg-secondary text-primary-foreground",
];

const EMOJIS = ["🍗", "🍕", "🍔", "🍟", "🥤", "🔥"];

function DealsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-3xl p-8 bg-secondary/50 animate-pulse h-64" />
      ))}
    </div>
  );
}

export function Deals() {
  const { data: deals, isLoading } = useDeals();
  const { addItem } = useCart();

  if (!isLoading && (!deals || deals.length === 0)) return null;

  return (
    <section id="deals" className="py-20 sm:py-28 bg-secondary relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-14">
          <span className="inline-block bg-accent/20 text-accent font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full mb-4">
            Hot Deals
          </span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-primary-foreground mb-4">
            Weekly <span className="text-accent">Bangers</span>
          </h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto">
            Bigger plates. Smaller prices. Don't miss a deal.
          </p>
        </div>

        {isLoading ? (
          <DealsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {deals?.map((deal, i) => {
              const emoji = EMOJIS[i % EMOJIS.length];
              const variant = VARIANT_CLASSES[i % VARIANT_CLASSES.length];
              return (
                <div
                  key={deal.id}
                  className={`relative rounded-3xl p-8 ${variant} shadow-deal hover:scale-[1.03] transition-transform duration-300 overflow-hidden`}
                >
                  <div className="absolute -top-6 -right-6 text-9xl opacity-20">
                    {emoji}
                  </div>
                  {deal.original_price > deal.deal_price && (
                    <span className="inline-block bg-black/20 text-current text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                      Save KES {deal.original_price - deal.deal_price}
                    </span>
                  )}
                  <h3 className="text-4xl sm:text-5xl font-display mb-3 leading-tight relative">
                    {deal.title}
                  </h3>
                  <p className="opacity-90 mb-6 relative">{deal.description}</p>
                  <div className="flex items-center justify-between relative">
                    <div>
                      {deal.original_price > deal.deal_price && (
                        <span className="text-lg line-through opacity-60 mr-2">
                          KES {deal.original_price}
                        </span>
                      )}
                      <span className="text-3xl font-display">
                        KES {deal.deal_price}
                      </span>
                    </div>
                    <button
                      onClick={() => addItem({
                        id: deal.id,
                        name: deal.title,
                        price: deal.deal_price,
                        photo_url: deal.photo_url || null,
                        category_id: "",
                        description: deal.description || "",
                        is_available: true,
                      } as any)}
                      className="bg-black/30 backdrop-blur-sm text-current border-2 border-current/50 px-5 py-2 rounded-full font-bold uppercase text-sm tracking-wide hover:bg-black/50 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
