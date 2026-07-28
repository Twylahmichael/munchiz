import { useState } from "react";
import burger from "@/assets/food-burger.jpg";
import pizza from "@/assets/food-pizza.jpg";
import fries from "@/assets/food-fries.jpg";
import chicken from "@/assets/food-chicken.jpg";
import wings from "@/assets/food-wings.jpg";
import drinks from "@/assets/food-drinks.jpg";
import { buildWhatsAppUrl } from "@/lib/whatsapp";


type Item = {
  name: string;
  desc: string;
  price: number;
  img: string;
  tag: string;
};

const items: Item[] = [
  {
    name: "Munchiz Classic Burger",
    desc: "Juicy beef patty, melted cheese, fresh lettuce & our secret sauce.",
    price: 450,
    img: burger,
    tag: "Burgers",
  },
  {
    name: "Meat Lovers Pizza",
    desc: "Loaded with beef, sausage, pepperoni & extra mozzarella.",
    price: 1200,
    img: pizza,
    tag: "Pizza",
  },
  {
    name: "Crispy Fries Bucket",
    desc: "Golden, salted, perfectly crispy. Comes with ketchup & mayo.",
    price: 200,
    img: fries,
    tag: "Fries",
  },
  {
    name: "Two Piece Chicken",
    desc: "Two pieces of crunchy fried chicken, marinated to perfection.",
    price: 380,
    img: chicken,
    tag: "Chicken",
  },
  {
    name: "Saucy Chicken Wings",
    desc: "6 pieces tossed in sweet & spicy sauce. Lick-your-fingers good.",
    price: 550,
    img: wings,
    tag: "Chicken",
  },
  {
    name: "Cold Sodas & Shakes",
    desc: "Ice-cold sodas, fresh juices & creamy milkshakes.",
    price: 150,
    img: drinks,
    tag: "Drinks",
  },
];

const CATEGORIES = ["All", "Burgers", "Pizza", "Fries", "Chicken", "Drinks"] as const;
type Category = (typeof CATEGORIES)[number];

export function Menu() {
  const [active, setActive] = useState<Category>("All");
  const filtered = active === "All" ? items : items.filter((i) => i.tag === active);

  return (
    <section id="menu" className="py-20 sm:py-28 bg-background relative scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="inline-block bg-primary/10 text-primary font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full mb-4">
            🔥 The Menu
          </span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-secondary mb-4">
            Pick Your <span className="text-primary">Munch</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every bite, made with vibes. Tap order — we'll handle the rest on WhatsApp.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Menu categories"
          className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-8 -mx-4 px-4 sm:justify-center sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 scrollbar-none"
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat === active;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(cat)}
                className={`shrink-0 px-4 py-2 rounded-full font-bold uppercase tracking-wide text-xs sm:text-sm border-2 transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-card-warm"
                    : "bg-transparent text-secondary border-border hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((item) => (

            <article
              key={item.name}
              className="group bg-card rounded-3xl overflow-hidden shadow-card-warm hover:shadow-deal hover:-translate-y-2 transition-all duration-300 border border-border"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.img}
                  alt={item.name}
                  width={768}
                  height={576}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-secondary text-accent text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  {item.tag}
                </span>
                <span className="absolute top-3 right-3 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-full shadow-md">
                  KES {item.price}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-2xl text-secondary mb-2">{item.name}</h3>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                  {item.desc}
                </p>
                <a
                  href={buildWhatsAppUrl(item.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-bold uppercase text-sm tracking-wide hover:bg-secondary transition-colors"
                >
                  Order on WhatsApp
                  <span aria-hidden>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
