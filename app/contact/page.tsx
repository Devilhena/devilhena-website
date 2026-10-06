import { ContactForm } from "@/components/ContactForm";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const details = [
  { title: "Call us", value: "+356 79636929", href: "tel:+35679636929", icon: Phone },
  { title: "WhatsApp us", value: "+356 79636929", href: "https://wa.me/35679636929", icon: MessageCircle, external: true },
  { title: "Email us", value: "devilhena206@gmail.com", href: "mailto:devilhena206@gmail.com", icon: Mail },
  { title: "Visit us", value: "Lion Fountain\nFloriana - Malta", href: "https://www.google.com/maps/search/?api=1&query=Lion+Fountain+Floriana+Malta", icon: MapPin, external: true, directions: true },
];

const gallery = [
  { src: "/de-vilhena-bistrot-collage.png", alt: "A collage of De Vilhena Bistrot interiors, drinks, coffee, desserts and dishes", className: "col-span-2" },
  { src: "/de-vilhena-counter.png", alt: "De Vilhena Bistrot pastry counter and bar", className: "" },
  { src: "/de-vilhena-menu-moment.png", alt: "Guests enjoying the De Vilhena menu", className: "" },
  { src: "/de-vilhena-guests.png", alt: "Guests enjoying drinks at De Vilhena Bistrot", className: "col-span-2" },
];

export default function Contact() {
  return <main className="pt-20">
    <section className="bg-forest px-5 py-20 text-cream lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-clay">De Vilhena Bistrot</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl sm:text-7xl">Get in <i className="text-clay">touch.</i></h1>
        <p className="mt-6 max-w-xl leading-7 text-cream/70">Have a question, want to place an order, or need more information? Get in touch with De Vilhena Bistrot.</p>
      </div>
    </section>

    <section className="px-5 py-16 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Find us</p>
          <h2 className="mt-3 font-display text-3xl">Ready to order?</h2>
          <p className="mt-4 text-sm leading-7 text-forest/70">Call, message, visit, or send your enquiry below. We’ll get back to you as soon as possible.</p>
          <div className="mt-8 space-y-3">
            {details.map(({ title, value, href, icon: Icon, external, directions }) => <a key={title} className="focus-ring flex gap-4 rounded-2xl border border-earth/15 p-5 transition hover:border-earth hover:bg-beige/40" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
              <Icon className="mt-1 text-gold" size={20} />
              <span>
                <span className="block text-[10px] font-semibold uppercase tracking-[.2em] text-earth">{title}</span>
                <span className="mt-2 block whitespace-pre-line text-sm leading-6">{value}</span>
                {directions && <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-earth">GET DIRECTIONS <ArrowUpRight size={13} /></span>}
                {title === "WhatsApp us" && <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-earth">MESSAGE US ON WHATSAPP <ArrowUpRight size={13} /></span>}
              </span>
            </a>)}
          </div>
        </div>
        <ContactForm />
      </div>

      <div className="mx-auto mt-16 max-w-7xl">
        <div className="grid overflow-hidden rounded-[2rem] border border-earth/15 bg-beige/35 lg:grid-cols-[.9fr_1.1fr]">
          <div className="bg-beige/50 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((image) => <figure key={image.src} className={`${image.className} flex h-40 items-center justify-center overflow-hidden rounded-xl bg-cream p-2 shadow-sm sm:h-44`}>
                <img src={image.src} alt={image.alt} className="h-full w-full object-contain" />
              </figure>)}
            </div>
          </div>
          <div className="p-6 sm:p-10">
            <p className="eyebrow">Our location</p>
            <h2 className="mt-3 font-display text-3xl">Find us at <i className="text-earth">Lion Fountain.</i></h2>
            <p className="mt-4 text-sm leading-7 text-forest/70">Visit De Vilhena Bistrot in Floriana, Malta. Use the map for directions or open it in Google Maps.</p>
            <div className="mt-7 overflow-hidden rounded-2xl border border-earth/15 bg-cream">
              <iframe title="De Vilhena Bistrot location at Lion Fountain, Floriana" src="https://www.google.com/maps?q=Lion%20Fountain%2C%20Floriana%2C%20Malta&output=embed" className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <a href="https://www.google.com/maps/search/?api=1&query=Lion+Fountain+Floriana+Malta" target="_blank" rel="noreferrer" className="focus-ring mt-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[.14em] text-earth hover:text-forest">OPEN IN GOOGLE MAPS <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
