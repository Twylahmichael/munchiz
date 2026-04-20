import heroBurger from "@/assets/hero-burger.jpg";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center overflow-hidden bg-secondary"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroBurger}
          alt="Juicy Munchiz burger with melted cheese and fresh toppings"
          width={1536}
          height={1024}
          className="w-full h-full object-cover opacity-50 md:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-secondary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent" />
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pt-24 pb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-float-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent font-bold uppercase text-xs tracking-widest">
              Now Open • Kamulu, Kangundo Rd
            </span>
          </div>

          <h1
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display text-primary-foreground leading-[0.9] mb-6 animate-float-up"
            style={{ animationDelay: "0.1s" }}
          >
            Munch
            <br />
            <span className="text-accent">Together,</span>
            <br />
            Laugh <span className="text-primary">Forever</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-primary-foreground/80 max-w-xl mb-8 animate-float-up"
            style={{ animationDelay: "0.2s" }}
          >
            Burgers that hit different. Pizzas that pull cheese for days. Wings that
            slap. Welcome to <span className="text-accent font-bold">Munchiz</span> —
            Kamulu's loudest plate.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 animate-float-up"
            style={{ animationDelay: "0.3s" }}
          >
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-8 py-4 rounded-full font-bold uppercase tracking-wide text-base shadow-card-warm hover:scale-105 transition-transform animate-pulse-glow"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Order Now via WhatsApp
            </a>
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold uppercase tracking-wide text-base shadow-card-warm hover:scale-105 transition-transform"
            >
              View Menu 🍕
            </a>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="w-6 h-10 border-2 border-accent/60 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-accent rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
