import burger from "@/assets/food-burger.jpg";
import pizza from "@/assets/food-pizza.jpg";
import fries from "@/assets/food-fries.jpg";
import chicken from "@/assets/food-chicken.jpg";
import wings from "@/assets/food-wings.jpg";
import drinks from "@/assets/food-drinks.jpg";

const photos = [
  { src: burger, alt: "Double cheeseburger with bacon", span: "row-span-2" },
  { src: pizza, alt: "Meat lovers pizza with cheese pull", span: "" },
  { src: fries, alt: "Crispy fries in red basket", span: "" },
  { src: chicken, alt: "Crispy fried chicken pieces", span: "" },
  { src: wings, alt: "Saucy chicken wings", span: "row-span-2" },
  { src: drinks, alt: "Refreshing drinks and shakes", span: "" },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-accent/20 text-secondary font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full mb-4">
            📸 The Gallery
          </span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-secondary mb-4">
            Drool <span className="text-primary">Mode</span> On
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real food, real flavors. No filters needed.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 sm:gap-4 auto-rows-[160px] sm:auto-rows-[220px]">
          {photos.map((p, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl group shadow-card-warm ${p.span}`}
            >
              <img
                src={p.src}
                alt={p.alt}
                width={768}
                height={768}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
