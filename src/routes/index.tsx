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
  head: () => ({
    meta: [
      { title: "Munchiz — Munch Together, Laugh Forever | Kamulu, Nairobi" },
      {
        name: "description",
        content:
          "Munchiz: bold burgers, cheesy pizzas, crispy chicken & cold drinks in Kamulu, Kangundo Road. Order on WhatsApp 0728466665.",
      },
      { property: "og:title", content: "Munchiz — Kamulu's Loudest Plate" },
      {
        property: "og:description",
        content:
          "Burgers that hit. Pizzas that pull cheese. Wings that slap. Order via WhatsApp.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
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
