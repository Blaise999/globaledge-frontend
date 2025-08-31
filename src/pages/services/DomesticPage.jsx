import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/globaledge.png";
/**
 * Domestic Shipping – Informative marketing page
 * - No external images required (pure Tailwind + inline SVG)
 * - Call-to-actions wire to your existing routes
 * - Mobile-first, accessible, fancy but lightweight
 */
export default function DomesticPage() {
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    {
      q: "Which cities do you cover for same-day delivery?",
      a: "Same-day is available in major metros and surrounding suburbs. Next-day covers nationwide routes. Enter pickup and drop-off in Create Shipment to see precise options.",
    },
    {
      q: "What items are restricted?",
      a: "Hazardous materials, cash, illegal substances, and fragile items without proper packaging. At checkout we’ll flag anything that needs special handling.",
    },
    {
      q: "Can you pick up from my location?",
      a: "Yes. Schedule pickups during label creation or from your Dashboard → Pickups. Choose time windows and add instructions like gate codes.",
    },
    {
      q: "Do you provide COD and returns?",
      a: "Yes—enable Cash-on-Delivery and easy returns on the e-commerce add-ons, or mention it when creating a label for ad-hoc shipments.",
    },
  ];

  const features = [
    {
      title: "Same-day / Next-day",
      desc: "In-city same-day by 8pm and next-day nationwide.",
      icon: <ZapIcon />,
    },
    {
      title: "Real-time tracking",
      desc: "SMS + email updates with live map checkpoints.",
      icon: <TrackIcon />,
    },
    {
      title: "Door pickup & drop-off",
      desc: "Schedule pickups or drop at partner counters nearby.",
      icon: <DoorIcon />,
    },
    {
      title: "Cash-on-Delivery",
      desc: "COD remittance with daily or weekly settlement.",
      icon: <WalletIcon />,
    },
    {
      title: "Delicate handling",
      desc: "Document, parcel, and fragile packing options.",
      icon: <BoxIcon />,
    },
    {
      title: "Business rates",
      desc: "Transparent pricing with volume discounts.",
      icon: <BadgeIcon />,
    },
  ];

  const tiers = [
    {
      name: "Documents",
      price: "From $3.50",
      badge: "Bike courier",
      bullets: ["Up to 0.5 kg", "Same-day in-city", "Signature on delivery"],
      href: "/services/express?type=parcel#quote",
    },
    {
      name: "Parcels",
      price: "From $5.90",
      badge: "Van network",
      bullets: ["0.5–20 kg", "Next-day nationwide", "Insurance available"],
      href: "/services/express?type=parcel#quote",
      featured: true,
    },
    {
      name: "Bulk / B2B",
      price: "Custom",
      badge: "Route optimized",
      bullets: ["Multiple stops", "Daily pickup windows", "Invoice billing"],
      href: "/contact",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
        {/* ======= Header (same as homepage) ======= */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-12 w-auto object-contain" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/track" className="text-sm font-medium text-gray-700 hover:text-gray-900">Track</Link>
              <Link to="/create" className="text-sm font-medium text-gray-700 hover:text-gray-900">Ship</Link>
              <a href="#rates" className="text-sm font-medium text-gray-700 hover:text-gray-900">Rates</a>
              <a href="#locations" className="text-sm font-medium text-gray-700 hover:text-gray-900">Locations</a>
              <a href="#support" className="text-sm font-medium text-gray-700 hover:text-gray-900">Support</a>
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth/login" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100">Log in</Link>
              <Link to="/auth/register" className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Register</Link>
              <Link to="/create" className="px-3 py-1.5 text-sm rounded-lg bg-black text-white hover:bg-gray-900">Create Shipment</Link>
            </div>
          </div>
        </div>
      </header>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
                Domestic network • 7 days a week
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight tracking-tight">
                Fast, reliable <span className="text-red-600">Domestic Shipping</span>
              </h1>
              <p className="mt-3 text-gray-600 max-w-xl">
                Same-day in the city, next-day nationwide. Door pickup, real-time
                tracking, and transparent rates—designed for both occasional senders
                and high-volume merchants.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/services/express?type=parcel#quote"
                  className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-900 active:scale-[0.98]"
                >
                  Calculate rates
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 rounded-xl bg-white border text-sm font-semibold hover:bg-gray-50 active:scale-[0.98]"
                >
                  Open business account
                </Link>
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-2 text-sm text-gray-700 max-w-lg">
                <li className="flex items-center gap-2">
                  <CheckIcon /> Same-day cut-off: <b>2:00 PM</b>
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Next-day cut-off: <b>6:00 PM</b>
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Saturday delivery: <b>Yes</b>
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon /> Insurance & COD: <b>Available</b>
                </li>
              </ul>
            </div>

            {/* Fancy card cluster (no images needed) */}
            <div className="relative">
              <div className="group p-6 rounded-3xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Today’s same-day routes</h3>
                  <span className="text-xs bg-white/15 px-2 py-1 rounded-lg ring-1 ring-white/20">
                    Live
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  {[
                    ["Downtown", "2–3h"],
                    ["Airport belt", "3–4h"],
                    ["Tech Park", "2–3h"],
                    ["Ikeja", "3–4h"],
                    ["Victoria Island", "2–3h"],
                    ["Lekki", "3–4h"],
                  ].map(([area, eta]) => (
                    <div key={area} className="rounded-xl bg-white/10 ring-1 ring-white/20 p-3">
                      <div className="font-medium">{area}</div>
                      <div className="text-white/80">{eta}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-white text-gray-900 p-4">
                  <div className="flex items-center gap-3">
                    <TrackMini />
                    <div>
                      <div className="text-sm font-semibold">GE987654321 — In transit</div>
                      <div className="text-xs text-gray-600">ETA today • Bike courier</div>
                    </div>
                    <Link
                      to="/track?ref=GE987654321"
                      className="ml-auto text-sm font-semibold text-red-700 hover:underline"
                    >
                      Track →
                    </Link>
                  </div>
                </div>
              </div>

              {/* floating card */}
              <div className="absolute -bottom-6 -right-6 w-40 sm:w-48 rounded-2xl border bg-white shadow-lg p-4">
                <div className="text-xs text-gray-500">Average on-time</div>
                <div className="text-2xl font-extrabold">98.3%</div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-[83%] bg-red-600" />
                </div>
                <div className="mt-2 text-[11px] text-gray-500">Last 30 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Everything you need for domestic delivery
          </h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f) => (
              <article
                key={f.title}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 grid place-items-center">
                  {f.icon}
                </div>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING / TIERS */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <span className="hidden md:inline text-sm text-gray-500">
              Fuel & surcharges included in quote
            </span>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4 sm:gap-6">
            {tiers.map((t) => (
              <article
                key={t.name}
                className={`relative rounded-2xl border p-5 bg-white shadow-sm ${
                  t.featured ? "ring-2 ring-red-600 border-red-200" : "border-gray-200"
                }`}
              >
                {t.featured && (
                  <span className="absolute -top-3 right-4 text-[11px] px-2 py-1 rounded-full bg-red-600 text-white">
                    Most popular
                  </span>
                )}
                <div className="text-xs text-gray-500">{t.badge}</div>
                <h3 className="mt-1 font-semibold">{t.name}</h3>
                <div className="mt-1 text-2xl font-extrabold">{t.price}</div>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <CheckIcon /> {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to={t.href}
                  className={`mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                    t.featured
                      ? "bg-black text-white hover:bg-gray-900"
                      : "bg-white border hover:bg-gray-50"
                  }`}
                >
                  Get started <ArrowIcon />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How it works</h2>

          <ol className="relative mt-8 space-y-6">
            <div className="pointer-events-none absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-red-300 via-gray-200 to-transparent" />
            {[
              ["Create label", "Enter addresses, choose Domestic, pick same-day or next-day."],
              ["Pickup or drop-off", "Schedule a window or use a nearby counter."],
              ["Track live", "Share the tracking link with your recipient."],
              ["Delivered", "Proof of delivery with name, time, and signature."],
            ].map(([title, desc], i) => (
              <li key={title} className="relative pl-14">
                <span className="absolute left-0 top-0 grid place-items-center h-10 w-10 rounded-full bg-white ring-2 ring-red-200 shadow-sm">
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-500 text-white text-sm font-bold grid place-items-center">
                    {i + 1}
                  </span>
                </span>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="font-semibold">{title}</div>
                  <p className="mt-1 text-sm text-gray-600">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Domestic FAQ</h2>
              <p className="mt-2 text-gray-600">
                Quick answers to the most common questions. Need more help?{" "}
                <Link to="/contact" className="text-red-700 font-semibold hover:underline">
                  Contact support
                </Link>
                .
              </p>
            </div>
            <div className="lg:col-span-2">
              <ul className="divide-y rounded-2xl border bg-white">
                {faqs.map((f, idx) => (
                  <li key={f.q} className="p-4 sm:p-5">
                    <button
                      className="w-full flex items-start gap-3 text-left"
                      onClick={() => setFaqOpen((o) => (o === idx ? null : idx))}
                    >
                      <span className="mt-1 h-6 w-6 grid place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-100">
                        ?
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">{f.q}</div>
                        <div
                          className={`text-sm text-gray-600 transition-all ${
                            faqOpen === idx ? "mt-2 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                          }`}
                        >
                          {f.a}
                        </div>
                      </div>
                      <span className={`ml-3 text-gray-500 transition ${faqOpen === idx ? "rotate-180" : ""}`}>▾</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Start shipping domestically today
            </h2>
            <p className="mt-2 text-white/90">
              Instant quotes with fuel and surcharges included. Scale with pickups,
              COD, and API integrations.
            </p>
          </div>
          <div className="flex gap-3 md:justify-end">
            <Link
              to="/services/express?type=parcel#quote"
              className="px-4 py-2 rounded-xl bg-white text-gray-900 font-semibold active:scale-[0.98]"
            >
              Create shipment
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 rounded-xl ring-1 ring-inset ring-white/60 font-semibold active:scale-[0.98]"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* === Tiny inline icons (keep file self-contained) === */
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 7l9 4 9-4M3 7l9-4 9 4M3 7v10l9 4 9-4V7" />
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M11 21 3 13h6L7 3h10l-4 8h6z" />
    </svg>
  );
}
function TrackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function DoorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <circle cx="14" cy="12" r="1" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M18 12h3" />
    </svg>
  );
}
function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 2l3 6 6 .9-4.5 4.4L17 20l-5-2.6L7 20l1.5-6.7L4 8.9 10 8z" />
    </svg>
  );
}
function TrackMini() {
  return (
    <svg viewBox="0 0 200 44" className="w-28 h-8" fill="none" aria-hidden>
      <rect x="1" y="1" width="198" height="42" rx="10" stroke="#e5e7eb" />
      <path d="M12 30C26 22 34 10 56 18c22 8 26 24 42 20 16-4 20-24 38-22 18 2 20 20 34 20" stroke="#ef4444" strokeWidth="2.4" />
      <circle cx="56" cy="18" r="3" fill="#ef4444" />
      <circle cx="140" cy="16" r="3" fill="#ef4444" />
      <circle cx="172" cy="36" r="3" fill="#ef4444" />
    </svg>
  );
}
