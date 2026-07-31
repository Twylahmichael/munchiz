import { createFileRoute } from "@tanstack/react-router";
import { CartProvider } from "@/lib/cart";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Menu } from "@/components/Menu";
import { Deals } from "@/components/Deals";
import { Gallery } from "@/components/Gallery";
import { FindUs } from "@/components/FindUs";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { CartDrawer } from "@/components/CartDrawer";

export const Route = createFileRoute("/")({
  head: () => {
    const title = "Munchiz — Bites of Happiness | Kanisani Rd, Nairobi";
    const description =
      "Bold burgers, cheesy pizzas, crispy chicken & cold drinks on Kanisani Road, Nairobi. Open daily 9am–9pm. Order on WhatsApp 0728466665.";
    const image = "/og-image.png";
    const url = "https://munchiz.co.ke/";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: "Munchiz, Nairobi food, Kanisani Road, fast food Nairobi, burgers, pizza delivery, WhatsApp order, bites of happiness" },
        { name: "theme-color", content: "#c1121f" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:alt", content: "Munchiz — Bites of happiness" },
        { property: "og:site_name", content: "Munchiz" },
        { property: "og:locale", content: "en_KE" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: "Munchiz",
            image: "https://munchiz.co.ke/og-image.png",
            url: "https://munchiz.co.ke/",
            telephone: "+254728466665",
            servesCuisine: ["Fast Food", "Burgers", "Pizza", "Chicken"],
            priceRange: "KES 100–2000",
            slogan: "Bites of Happiness",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Kanisani Road",
              addressLocality: "Nairobi",
              postalCode: "63665",
              addressRegion: "Nairobi",
              addressCountry: "KE",
            },
            openingHoursSpecification: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              opens: "09:00",
              closes: "21:00",
            },
          }),
        },
      ],
    };
  },

  component: Index,
});

function Index() {
  return (
    <CartProvider>
      <Navbar />
      <main>
        <Hero />
        <Menu />
        <Deals />
        <Gallery />
        <FindUs />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <CartDrawer />
    </CartProvider>
  );
}
