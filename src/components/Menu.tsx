import { useState } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { AddToCartModal } from "@/components/AddToCartModal";
import type { MenuItem } from "@/lib/database.types";

function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-3xl overflow-hidden shadow-card-warm border border-border animate-pulse"
        >
          <div className="aspect-[4/3] bg-muted" />
          <div className="p-5 sm:p-6 space-y-3">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-12 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Menu() {
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: items, isLoading: itemsLoading } = useMenuItems();
  const { setIsOpen: setCartOpen } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);

  const isLoading = catsLoading || itemsLoading;

  const visibleCategories = categories?.filter((c) => c.is_active);

  const filtered =
    activeSlug === "all"
      ? items?.filter((i) => visibleCategories?.some((c) => c.id === i.category_id))
      : items?.filter((i) => {
          const cat = visibleCategories?.find((c) => c.id === i.category_id);
          return cat?.slug === activeSlug;
        });

  return (
    <section id="menu" className="py-20 sm:py-28 bg-background relative scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="inline-block bg-primary/10 text-primary font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full mb-4">
            The Menu
          </span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-secondary mb-4">
            Pick Your <span className="text-primary">Munch</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every bite, made with vibes. Add to cart and checkout in seconds.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Menu categories"
          className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-8 -mx-4 px-4 sm:justify-center sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 scrollbar-none"
        >
          <button
            role="tab"
            aria-selected={activeSlug === "all"}
            onClick={() => setActiveSlug("all")}
            className={`shrink-0 px-4 py-2 rounded-full font-bold uppercase tracking-wide text-xs sm:text-sm border-2 transition-all ${
              activeSlug === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-card-warm"
                : "bg-transparent text-secondary border-border hover:border-primary hover:text-primary"
            }`}
          >
            All
          </button>
          {visibleCategories?.map((cat) => {
            const isActive = cat.slug === activeSlug;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSlug(cat.slug)}
                className={`shrink-0 px-4 py-2 rounded-full font-bold uppercase tracking-wide text-xs sm:text-sm border-2 transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-card-warm"
                    : "bg-transparent text-secondary border-border hover:border-primary hover:text-primary"
                }`}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <MenuSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered?.map((item) => {
              const category = categories?.find((c) => c.id === item.category_id);
              return (
                <article
                  key={item.id}
                  className="group bg-card rounded-3xl overflow-hidden shadow-card-warm hover:shadow-deal hover:-translate-y-2 transition-all duration-300 border border-border"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        width={768}
                        height={576}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-6xl">
                        {category?.icon || "🍽️"}
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-secondary text-accent text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      {category?.name}
                    </span>
                    <span className="absolute top-3 right-3 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-full shadow-md">
                      KES {item.price}
                    </span>
                    {user && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm z-10"
                        aria-label={
                          isFavorite(item.id) ? "Remove from favorites" : "Add to favorites"
                        }
                      >
                        <Heart
                          size={18}
                          className={
                            isFavorite(item.id) ? "fill-red-500 text-red-500" : "text-gray-500"
                          }
                        />
                      </button>
                    )}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-secondary/70 flex items-center justify-center">
                        <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-bold uppercase tracking-wide text-sm">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-2xl text-secondary mb-2">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                      {item.combo_options?.length === 2
                        ? `Choose between ${item.combo_options[0].label.toLowerCase()} and ${item.combo_options[1].label.toLowerCase()}.`
                        : item.description}
                    </p>
                    <button
                      onClick={() => setPickerItem(item)}
                      disabled={!item.is_available}
                      className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-bold uppercase text-sm tracking-wide hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={16} />
                      {item.is_available ? "Add to Cart" : "Sold Out"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {pickerItem && (
        <AddToCartModal
          item={pickerItem}
          onClose={() => setPickerItem(null)}
          onCheckout={() => {
            setPickerItem(null);
            setCartOpen(true);
          }}
        />
      )}
    </section>
  );
}
