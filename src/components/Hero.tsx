import heroBurger from "@/assets/hero-burger.jpg";

export function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center overflow-hidden bg-secondary"
    >
      <div className="absolute inset-0">
        <img
          src={heroBurger}
          alt="Juicy Munchiz burger with melted cheese and fresh toppings"
          width={1536}
          height={1024}
          loading="eager"
          // @ts-expect-error fetchpriority is valid HTML but not yet typed on React
          fetchpriority="high"
          decoding="async"
          className="w-full h-full object-cover opacity-50 md:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-secondary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent" />
      </div>

      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-24 pb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-float-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent font-bold uppercase text-xs tracking-widest">
              Open Daily 9am–9pm &bull; Kanisani Rd, Nairobi
            </span>
          </div>

          <h1
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display text-primary-foreground leading-[0.9] mb-6 animate-float-up"
            style={{ animationDelay: "0.1s" }}
          >
            Bites
            <br />
            <span className="text-accent">of</span>
            <br />
            <span className="text-primary">Happiness</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-primary-foreground/80 max-w-xl mb-8 animate-float-up"
            style={{ animationDelay: "0.2s" }}
          >
            Burgers that hit different. Pizzas that pull cheese for days. Wings that
            slap. Welcome to <span className="text-accent font-bold">Munchiz</span> —
            Nairobi's loudest plate.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 animate-float-up"
            style={{ animationDelay: "0.3s" }}
          >
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold uppercase tracking-wide text-base shadow-card-warm hover:scale-105 transition-transform"
            >
              Order Now
            </a>
            <a
              href="#deals"
              className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold uppercase tracking-wide text-base shadow-card-warm hover:scale-105 transition-transform"
            >
              View Deals
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="w-6 h-10 border-2 border-accent/60 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-accent rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
