import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./assets/globaledge.png";
import TranslateToggle from "./utils/translatetoggle";
import { loadGoogleTranslate, initWidget, ensureBannerHidden, setLanguage } from "./utils/googleTranslate";
import TranslateButton from "./TranslateDot";
import TranslateDot from "./TranslateDot";
import { ChatWidget } from "./components/support/ChatWidget";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  // testimonials auto-slide
  const tRef = useRef(null);
  const pauseRef = useRef(false);

  // services auto-scroll (mobile)
  const sRef = useRef(null);
  const sPauseRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Testimonials auto-slide
  useEffect(() => {
    const el = tRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const tick = () => {
      if (pauseRef.current || !tRef.current) return;
      const { scrollLeft, clientWidth, scrollWidth } = tRef.current;
      const nearEnd = scrollLeft + clientWidth >= scrollWidth - 2;
      tRef.current.scrollTo({
        left: nearEnd ? 0 : scrollLeft + clientWidth * 0.9,
        behavior: "smooth",
      });
    };

    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  // Services slow auto-scroll (mobile only)
  useEffect(() => {
    const el = sRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let rafId;
    let lastTs = 0;

    const step = (ts) => {
      if (!el || sPauseRef.current) {
        rafId = requestAnimationFrame(step);
        return;
      }
      const dt = Math.min(32, ts - lastTs || 16);
      lastTs = ts;

      const pxPerSec = 20;
      const dx = (pxPerSec * dt) / 1000;

      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 1) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += dx;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Header nav → real routes
  const nav = [
    { label: "Track", to: "/track" },
    { label: "Create Shipment", to: "/services/express" },
    { label: "Rates", to: "/services/express?type=parcel#quote" }, // calculate rates
    { label: "Locations", to: "/#locations" }, // stays as section link
    { label: "Support", to: "/faq" },          // your FAQ page
  ];

  // map service titles to routes
  const serviceLinks = {
    "Express Delivery": "/services/express",
    "Freight & Cargo": "/services/freight",
    "E-commerce": "/services/ecommerce",
    "Customs & Clearance": "/services/customs",
    "Domestic Shipping": "/services/domestic",
    "Warehousing": "/services/warehousing",
  };

  return (
  <div className="min-h-screen bg-white text-gray-900 pb-24 md:pb-0">
     {/* ======= Header ======= */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src={Logo}
                alt="GlobalEdge"
                className="h-14 w-auto object-contain notranslate"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {nav.map((n) =>
                n.to.startsWith("/#") ? (
                  <a
                    key={n.label}
                    href={n.to.replace("/", "")}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {n.label}
                  </a>
                ) : (
                  <Link
                    key={n.label}
                    to={n.to}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {n.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* 🌐 Sleek translate pill (the ONLY instance that mounts/initializes) */}
              <TranslateDot/>

              <Link
                to="/auth/login"
                className="px-3.5 py-2 text-sm font-medium rounded-xl hover:bg-gray-100"
              >
                Log in
              </Link>
              <Link
                to="/auth/register"
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Register
              </Link>
              <Link
                to="/services/express"
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-black text-white hover:bg-gray-900"
              >
                Create Shipment
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Open menu"
              onClick={() => setMobileOpen((s) => !s)}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-2">
              {/* 🌐 Mobile copy of the pill — no mount, no init */}
              <div className="mb-2">
                <TranslateToggle mount={false} init={false} />
              </div>

              {nav.map((n) =>
                n.to.startsWith("/#") ? (
                  <a
                    key={n.label}
                    href={n.to.replace("/", "")}
                    className="block px-2 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {n.label}
                  </a>
                ) : (
                  <Link
                    key={n.label}
                    to={n.to}
                    className="block px-2 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {n.label}
                  </Link>
                )
              )}

              <div className="pt-2 flex gap-2">
                <Link
                  to="/auth/login"
                  className="flex-1 text-center px-3 py-2 rounded-lg bg-gray-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/auth/register"
                  className="flex-1 text-center px-3 py-2 rounded-lg bg-red-600 text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
                <Link
                  to="/services/express"
                  className="flex-1 text-center px-3 py-2 rounded-lg bg-black text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Create Shipment
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
      {/* ======= Hero / Track ======= */}
      <section id="track" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-red-50/40 via-white to-white md:from-gray-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 grid lg:grid-cols-2 items-center gap-10">
          {/* Left */}
          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <div className="relative inline-block">
              <span className="absolute -inset-2 -z-10 rounded-full bg-red-100/30 blur-xl md:hidden" />
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-inset ring-red-100">
                Global express • Reliable logistics
              </span>
            </div>

            <h1 className="mt-4 text-5xl sm:text-5xl md:text-5xl font-black leading-tight tracking-tight">
              Ship anywhere. <span className="text-red-600">Track</span> everything.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-xl">
              GlobalEdge connects your business to the world with fast delivery, real-time tracking, and transparent pricing.
            </p>

            {/* Track form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (trackingId.trim()) {
                  navigate(`/track?ref=${trackingId.trim()}`);
                }
              }}
              className="mt-6 p-2 rounded-2xl bg.white border border-gray-200 shadow-md flex items-stretch gap-2"
            >
              <div className="flex items-center px-3 text-gray-400">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
              </div>
              <input
                type="text"
                className="flex-1 min-w-0 outline-none rounded-xl px-2 text-sm sm:text-base py-3 placeholder:opacity-70"
                placeholder="Enter tracking ID"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-900 active:scale-[0.98] transition w-28"
              >
                Track
              </button>
            </form>

            {/* Quick links */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <Link
                to="/services/express"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.98]"
              >
                <BoltIcon /> Create Shipment
              </Link>
              <Link
                to="/services/express?type=parcel#quote"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.98]"
              >
                <CalculatorIcon /> Get Rates
              </Link>
              <a
                href="#locations"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.98]"
              >
                <PinIcon /> Find Locations
              </a>
            </div>
          </div>

          {/* Right visuals */}
          <div className="relative group">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-red-100/50 via-transparent to-transparent blur-2xl md:hidden" />

            <div className="mt-8 md:mt-0 aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-xl">
              <img
                src="/delivery.png"
                alt="Courier"
                className="h-full w-full object-cover md:object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            <div className="absolute left-2 -bottom-4 md:-bottom-6 md:-left-6 w-32 h-20 md:w-44 md:h-28 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow transition-all duration-500 group-hover:-translate-y-2 group-hover:-translate-x-1 group-hover:shadow-lg">
              <img src="/truck.png" alt="Truck delivery" className="h-full w-full object-cover md:object-cover" loading="lazy" />
            </div>

            <div className="absolute right-2 -top-4 md:-top-6 md:-right-6 w-24 h-24 md:w-36 md:h-36 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow transition-all duration-500 group-hover:translate-y-2 group-hover:translate-x-1 group-hover:shadow-lg">
              <img src="/courier.png" alt="Package delivery" className="h-full w-full object-cover md:object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ======= Services ======= */}
      <section id="ship" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Services</h2>
            <a href="#" className="text-sm font-semibold text-red-600 hover:text-red-700 hidden md:inline-block">

            </a>
          </div>

          <div
            ref={sRef}
            className="mt-6 flex gap-3 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none"
            onMouseEnter={() => (sPauseRef.current = true)}
            onMouseLeave={() => (sPauseRef.current = false)}
            onTouchStart={() => (sPauseRef.current = true)}
            onTouchEnd={() => (sPauseRef.current = false)}
          >
            {[
              { title: "Express Delivery", desc: "Door-to-door parcels within 24–72h worldwide." },
              { title: "Freight & Cargo", desc: "Air, sea, and road freight for pallets and containers." },
              { title: "E-commerce", desc: "Checkout integrations, returns, and COD solutions." },
              { title: "Customs & Clearance", desc: "Brokerage support to move shipments without delays." },
              { title: "Domestic Shipping", desc: "Same-day / next-day across major cities." },
              { title: "Warehousing", desc: "Inventory, pick & pack, and fulfillment at scale." },
            ].map((s) => (
              <article
                key={s.title}
                className="snap-start min-w-[80%] md:min-w-0 p-5 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition bg-white"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                  <BoxIcon />
                </div>

                {/* === ONLY LOCAL CHANGE: label shown as "Create Shipment" for this card === */}
                <h3 className="mt-4 font-semibold text-lg">
                  {s.title === "Express Delivery" ? "Create Shipment" : s.title}
                </h3>

                <p className="mt-1 text-sm text-gray-600">{s.desc}</p>

                {/* Link remains mapped by the original title key */}
                <Link to={serviceLinks[s.title]} className="mt-4 inline-block text-sm font-semibold text-red-600 hover:text-red-700">
                  Learn more →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======= Coverage ======= */}
      <section id="locations" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Global coverage, local expertise</h2>
              <p className="mt-3 text-gray-600 max-w-prose">
                Our network spans 220+ destinations with service points near you. Schedule pickups, drop-offs, and returns with ease.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Same-day pickup in major cities
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Live tracking & delivery updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon />
                  Duty & tax calculator at checkout
                </li>
              </ul>
              <div className="mt-6 flex gap-3">
                <Link to="/services/express?type=parcel#quote" className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold active:scale-[0.98]">
                  Get rates
                </Link>
                <Link to="/contact" className="px-4 py-2 rounded-xl bg-white border text-sm font-semibold active:scale-[0.98]">
                  Contact support
                </Link>
              </div>
            </div>

            <div className="mx-[-1rem] md:mx-0">
              <div className="aspect-[16/10] rounded-none md:rounded-3xl overflow-hidden border border-gray-200 shadow">
                <img src="/map.png" alt="Global coverage map" className="h-full w-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= Steps ======= */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ship in three steps</h2>
            <span className="hidden md:inline-block text-sm text-gray-500">Fast, simple, reliable</span>
          </div>

          {(() => {
            const steps = [
              { title: "Create", desc: "Enter addresses, choose service, print label.", icon: <BoxIcon /> },
              { title: "Hand-off", desc: "Schedule a pickup or drop at a nearby location.", icon: <TruckIcon /> },
              { title: "Track", desc: "Follow progress in real time until delivery.", icon: <PinIcon /> },
            ];

            return (
              <>
                {/* Mobile timeline */}
                <ol className="relative mt-8 space-y-6 md:hidden">
                  <div className="pointer-events-none absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-red-300 via-gray-200 to-transparent" />
                  {steps.map((s, i) => (
                    <li key={s.title} className="relative pl-14">
                      <span className="absolute left-0 top-0 grid place-items-center h-10 w-10 rounded-full bg-white ring-2 ring-red-200 shadow-sm">
                        <span className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-500 text-white text-sm font-bold grid place-items-center">
                          {i + 1}
                        </span>
                      </span>

                      <div
                        className={`group rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-4 shadow-sm hover:shadow-lg transition-all ${
                          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        }`}
                        style={{ transitionDuration: "600ms", transitionDelay: `${i * 120}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-red-50 text-red-700 grid place-items-center">{s.icon}</div>
                          <h3 className="font-semibold">{s.title}</h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Desktop cards */}
                <div className="hidden md:grid md:grid-cols-3 gap-4 sm:gap-6 mt-8">
                  {steps.map((s, i) => (
                    <article key={s.title} className="group relative overflow-hidden p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/60 group-hover:to-red-100/50 transition-colors" />
                      <div className="pointer-events-none absolute -right-4 -bottom-6 text-7xl font-black text-red-100/60">{i + 1}</div>

                      <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 grid place-items-center">{s.icon}</div>
                        <h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ======= Rates CTA ======= */}
      <section id="rates" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Transparent pricing for every shipment</h2>
              <p className="mt-2 text-white/90">Instant quotes with fuel, duties, and surcharges upfront—no surprises.</p>
              <div className="mt-6 flex gap-3">
                <Link
                  to="/services/express?type=parcel#quote"
                  className="px-4 py-2 rounded-xl bg-white text-gray-900 font-semibold active:scale-[0.98]"
                >
                  Calculate rates
                </Link>
                <Link to="/contact" className="px-4 py-2 rounded-xl ring-1 ring-inset ring-white/60 font-semibold active:scale-[0.98]">
                  Talk to sales
                </Link>
              </div>
            </div>
            <div className="aspect-[16/10] rounded-3xl overflow-hidden bg-white/10 ring-1 ring-inset ring-white/20 flex items-center justify-center">
              <img src="/calculator.png" alt="Rates chart" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ======= Testimonials ======= */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Trusted by fast-moving brands</h2>

          <div
            ref={tRef}
            className="mt-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none"
            onMouseEnter={() => (pauseRef.current = true)}
            onMouseLeave={() => (pauseRef.current = false)}
            onTouchStart={() => (pauseRef.current = true)}
            onTouchEnd={() => (pauseRef.current = false)}
          >
            {[
              {
                quote: "GlobalEdge slashed our international transit times by 30% without raising costs.",
                name: "Mirabel A.",
                role: "COO, NovaWear",
              },
              {
                quote: "Labels, pickups, customs—everything in one place. Our NPS jumped 15 points.",
                name: "Liu Chen",
                role: "Head of Ops, LuminaTech",
              },
              {
                quote: "The tracking page is clean and accurate. Our support tickets dropped by half.",
                name: "Derrick M.",
                role: "Founder, KudiMart",
              },
            ].map((t) => (
              <figure key={t.name} className="snap-start min-w-[85%] md:min-w-0 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
                <blockquote className="text-sm text-gray-700">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-medium">
                  {t.name} <span className="text-gray-500 font-normal">— {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ======= Support / Footer CTA ======= */}
      <section id="support" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Need help right now?</h2>
            <p className="mt-2 text-gray-600">Our 24/7 team can assist with pickups, customs, and delivery issues.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/contact" className="px-4 py-2 rounded-xl bg-black text-white font-semibold active:scale-[0.98]">
                Chat with support
              </Link>
              <Link to="/contact" className="px-4 py-2 rounded-xl bg-white border font-semibold active:scale-[0.98]">
                Open a ticket
              </Link>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-gray-200">
            <img src="/help.png" alt="Customer support illustration" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ======= Footer ======= */}
      <footer className="bg-gray-950 text-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-8 md:grid-cols-5 md:gap-10">
            <div className="md:col-span-2">
              <div className="h-9 w-28 rounded-lg bg-white/10 border border-white/10 mb-3" />
              <p className="text-gray-400 max-w-sm">
                GlobalEdge delivers to 220+ destinations with transparent rates and reliable tracking.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/faq" className="px-3 py-1.5 rounded-full bg.white/10 bg-white/10 hover:bg-white/15 border border-white/10 text-sm">
                  24/7 Support
                </Link>
                <Link to="/services/express?type=parcel#quote" className="px-3 py-1.5 rounded-full bg-white text-gray-900 font-semibold text-sm">
                  Get rates
                </Link>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="mt-5 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
                <input type="email" placeholder="Work email" className="flex-1 bg-transparent outline-none placeholder:text-gray-500 text-sm" />
                <button className="px-3 py-2 rounded-lg bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100">Subscribe</button>
              </form>

              <div className="mt-5 flex items-center gap-3 text-gray-400">
                <a href="#" aria-label="Twitter" className="p-2 rounded-lg hover:bg-white/10">
                  <TwitterIcon />
                </a>
                <a href="#" aria-label="Instagram" className="p-2 rounded-lg hover:bg-white/10">
                  <InstagramIcon />
                </a>
                <a href="#" aria-label="LinkedIn" className="p-2 rounded-lg hover:bg-white/10">
                  <LinkedInIcon />
                </a>
              </div>
            </div>

            <div className="md:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <details className="group md:open" open>
                <summary className="list-none flex items-center justify-between cursor-pointer md:cursor-default">
                  <span className="font-semibold text-white">Company</span>
                  <span className="md:hidden text-gray-500 group-open:rotate-180 transition">▾</span>
                </summary>
                <ul className="mt-3 space-y-2 text-gray-400 text-sm md:mt-4">
                  <li>
                    <Link className="hover:text-white" to="/about">
                      About
                    </Link>
                  </li>
                  <li>
                    <a className="hover:text-white" href="#">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white" href="#">
                      News
                    </a>
                  </li>
                </ul>
              </details>

              <details className="group md:open" open>
                <summary className="list-none flex items-center justify-between cursor-pointer md:cursor-default">
                  <span className="font-semibold text-white">Resources</span>
                  <span className="md:hidden text-gray-500 group-open:rotate-180 transition">▾</span>
                </summary>
                <ul className="mt-3 space-y-2 text-gray-400 text-sm md:mt-4">
                  <li>
                    <a className="hover:text-white" href="#">
                      Developers
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white" href="#">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white" href="#">
                      API status
                    </a>
                  </li>
                </ul>
              </details>

              <details className="group md:open" open>
                <summary className="list-none flex items-center justify-between cursor-pointer md:cursor-default">
                  <span className="font-semibold text-white">Legal</span>
                  <span className="md:hidden text-gray-500 group-open:rotate-180 transition">▾</span>
                </summary>
                <ul className="mt-3 space-y-2 text-gray-400 text-sm md:mt-4">
                  <li>
                    <a className="hover:text-white" href="#">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white" href="#">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white" href="#">
                      Cookies
                    </a>
                  </li>
                </ul>
              </details>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400">
            <div>© {new Date().getFullYear()} GlobalEdge Logistics Ltd.</div>
            <div className="flex items-center gap-4">
              <a className="hover:text-white" href="#">
                Sitemap
              </a>
              <a className="hover:text-white" href="#">
                Security
              </a>
              <a className="hover:text-white" href="#">
                Status
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ======= Mobile Action Bar ======= */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-50 flex gap-2">
        <Link to="/services/express" className="flex-1 text-center px-4 py-3 rounded-xl bg-black text-white font-semibold shadow-lg active:scale-[0.98]">
          Create Shipment
        </Link>
        <Link to="/track" className="px-4 py-3 rounded-xl bg-white border font-semibold shadow-lg active:scale-[0.98]">
          Track
        </Link>
      </div>

      {/* Support chat widget */}
      <ChatWidget />
    </div>
  );
}

/* --- Tiny inline icon components --- */
function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M11 21 3 13h6L7 3h10l-4 8h6z" />
    </svg>
  );
}
function CalculatorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h3M13 15h3" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
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
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 6h10v8H3z" />
      <path d="M13 9h4l3 3v2h-7z" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="17.5" cy="16.5" r="1.5" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M22 5.8c-.7.3-1.5.5-2.2.6.8-.5 1.4-1.2 1.7-2.1-.8.5-1.7.8-2.6 1-1.5-1.6-4.1-1.2-5.2.9-.5 1-.5 2.1-.1 3.1-3.2-.2-6-1.7-7.9-4.2-1.1 2 .1 4.5 2.2 5.5-.6 0-1.2-.2-1.7-.5 0 2.1 1.5 3.9 3.6 4.3-.4.1-.8.2-1.2.2-.3 0-.6 0-.9-.1.6 1.8 2.3 3.1 4.3 3.2-1.6 1.2-3.6 1.9-5.6 1.9h-1c2.1 1.3 4.6 2 7.1 2 8.5 0 13.2-7.2 12.9-13.7.9-.6 1.5-1.3 2.1-2.1z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 1 0 12 7.3zm0 7.6A2.9 2.9 0 1 1 12 9.1a2.9 2.9 0 0 1 0 5.8z" />
      <path d="M17 2H7C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5zm3.2 15c0 1.8-1.4 3.2-3.2 3.2H7C5.2 20.2 3.8 18.8 3.8 17V7C3.8 5.2 5.2 3.8 7 3.8h10c1.8 0 3.2 1.4 3.2 3.2v10z" />
      <circle cx="17.5" cy="6.5" r="1.2" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5C4.98 4.6 4.1 5.5 3 5.5S1 4.6 1 3.5 1.9 1.5 3 1.5s1.98.9 1.98 2zM1.2 8.3h3.6V22H1.2zM8.4 8.3h3.5v1.9h.1c.5-.9 1.7-2.1 3.6-2.1 3.9 0 4.6 2.6 4.6 6V22h-3.6v-6.2c0-1.5 0-3.5-2.1-3.5-2.1 0-2.4 1.6-2.4 3.4V22H8.4z" />
    </svg>
  );
}
