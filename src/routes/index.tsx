import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Menu } from "@/components/Menu";
import { Deals } from "@/components/Deals";
import { Gallery } from "@/components/Gallery";
import { FindUs } from "@/components/FindUs";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export const Route = createFileRoute("/")({
  head: () => {
    const title = "Munchiz — Munch Together, Laugh Forever | Kamulu, Nairobi";
    const description =
      "Bold burgers, cheesy pizzas, crispy chicken & cold drinks in Kamulu, Kangundo Rd. Order on WhatsApp 0728466665 — fast delivery & pickup.";
    const image =
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a6df8b30-17d4-4ebe-b43d-448d91d7b7b8/id-preview-0c9e1562--cb63cdf2-72d3-4c6e-9466-fbf3ba7ad859.lovable.app-1776652272170.png";
    const url = "https://munchiz.lovable.app/";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: "Munchiz, Kamulu food, Kangundo Road, fast food Nairobi, burgers Kamulu, pizza delivery, WhatsApp order" },
        { name: "theme-color", content: "#c1121f" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:alt", content: "Munchiz — Kamulu's loudest plate" },
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
            image,
            url,
            telephone: "+254728466665",
            servesCuisine: ["Fast Food", "Burgers", "Pizza", "Chicken"],
            priceRange: "KES 150–1200",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Kanisani, off Kangundo Road",
              addressLocality: "Kamulu",
              addressRegion: "Nairobi",
              addressCountry: "KE",
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
    <>
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
    </>
  );
}
