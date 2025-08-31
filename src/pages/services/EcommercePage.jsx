// src/pages/services/EcommercePage.jsx
import Logo from "../../assets/globaledge.png"; // <- adjust if your path differs
import CommerceImg from "../../assets/commerce.png"; // <-- added

export default function EcommercePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== Header (logo + back) ===== */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </a>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/15 ring-1 ring-white/25">
                <CartIcon /> E-commerce logistics
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">
                E-Commerce Delivery — fast, reliable, global.
              </h1>
              <p className="mt-4 text-white/90 max-w-prose">
                Convert more checkouts with <b>time-definite shipping</b>, proactive alerts, and seamless returns.
                GlobalEdge integrates with your store and ships to <b>220+ destinations</b>.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#overview" className="px-4 py-2 rounded-xl bg-white text-gray-900 font-semibold active:scale-[0.98]">
                  See how it works
                </a>
                <a href="/services/express?type=parcel#quote" className="px-4 py-2 rounded-xl ring-1 ring-inset ring-white/60 font-semibold active:scale-[0.98]">
                  Get parcel rates
                </a>
              </div>

              <dl className="mt-8 grid grid-cols-3 gap-4 text-sm text-white/90">
                <Stat label="Destinations" value="220+ countries" />
                <Stat label="On-time SLA" value="98.7%" />
                <Stat label="Integrations" value="Shopify & more" />
              </dl>
            </div>

            {/* === Replaced placeholder with an image that fits perfectly === */}
            <div className="rounded-3xl overflow-hidden bg-white/10 ring-1 ring-white/20 p-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/10">
                <img
                  src={CommerceImg}
                  alt="E-commerce delivery"
                  className="h-full w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Value Props ===== */}
      <section id="overview" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Built for modern online stores</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Feature icon={<RocketIcon />} title="Fast cross-border" text="Express lanes with customs pre-clearance for 24–72h international delivery." />
            <Feature icon={<PlugIcon />}   title="Plug-and-play integrations" text="Connect Shopify, WooCommerce, custom carts, or your WMS via API." />
            <Feature icon={<BellIcon />}   title="Proactive notifications" text="Branded tracking & alerts at every scan to cut WISMO tickets." />
            <Feature icon={<BoxIcon />}    title="Optimized packaging" text="Cartonization tips that reduce damage and dimensional weight." />
            <Feature icon={<RefreshIcon />}title="Easy returns" text="Pre-approved labels and local drop-offs to build trust." />
            <Feature icon={<ShieldIcon />} title="Insurance options" text="Optional coverage for declared value and sensitive SKUs." />
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How it works</h2>
            <span className="hidden md:inline-block text-sm text-gray-500">Fast, simple, reliable</span>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-4 sm:gap-6">
            <Step index={1} title="Connect" text="Link your store or import orders via CSV/API." />
            <Step index={2} title="Fulfil"  text="Print labels, schedule pickups, and hand over parcels." />
            <Step index={3} title="Delight" text="Track in real time with branded status updates." />
          </div>
        </div>
      </section>

      {/* ===== Integrations ===== */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Works with your stack</h2>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <LogoPill name="Shopify" />
            <LogoPill name="WooCommerce" />
            <LogoPill name="BigCommerce" />
            <LogoPill name="Magento" />
            <LogoPill name="Custom API" />
            <LogoPill name="WMS/3PL" />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Need a custom workflow? Our API supports order webhooks, label generation, tracking, and returns.
          </p>
        </div>
      </section>

      {/* ===== Parcel table ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Parcel service levels</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <Th>Level</Th><Th>Transit time</Th><Th>Pickup</Th><Th>Max piece weight</Th><Th>Dimensional divisor</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <Tr><Td>Standard</Td><Td>2–5 business days</Td><Td>Same/next day</Td><Td>70 kg</Td><Td>5000 (cm)</Td></Tr>
                <Tr><Td>Express</Td><Td>24–72 hours</Td><Td>Same day</Td><Td>70 kg</Td><Td>5000 (cm)</Td></Tr>
                <Tr><Td>Priority</Td><Td>12–48 hours</Td><Td>Same day (earliest cut-offs)</Td><Td>70 kg</Td><Td>5000 (cm)</Td></Tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">Times are estimates and may vary by route, weather, or customs.</p>
        </div>
      </section>

      {/* ===== Outcomes ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Merchants see the difference</h2>
          <div className="mt-6 grid sm:grid-cols-3 gap-4 sm:gap-6">
            <KpiCard value="↓ 28%" label="WISMO tickets" note="Fewer ‘Where is my order?’ messages" />
            <KpiCard value="↑ 14%" label="Checkout conversion" note="Clear delivery promises & returns" />
            <KpiCard value="↓ 18%" label="Shipping cost/kg" note="Optimized packaging & routing" />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 bg-red-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Make delivery your growth lever</h2>
          <p className="mt-3 text-red-100">See instant parcel pricing or learn about freight for bulky shipments.</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <a href="/services/express?type=parcel#quote" className="px-6 py-3 rounded-xl bg-white text-red-700 font-semibold hover:bg-gray-100">
              Get Parcel Rates
            </a>
            <a href="/services/freight" className="px-6 py-3 rounded-xl ring-1 ring-inset ring-white/70 font-semibold hover:bg-white/10">
              Learn about Freight
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===== Tiny UI & Icons ===== */
function Feature({ icon, title, text }) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:shadow-sm transition">
      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 grid place-items-center">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{text}</p>
    </div>
  );
}
function Step({ index, title, text }) {
  return (
    <div className="group relative overflow-hidden p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      <div className="pointer-events-none absolute -right-4 -bottom-6 text-7xl font-black text-red-100/60">{index}</div>
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 grid place-items-center"><BoxIcon /></div>
        <h3 className="mt-4 font-semibold text-lg">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{text}</p>
      </div>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 ring-1 ring-inset ring-white/20">
      <div className="text-xs text-white/80">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
function LogoPill({ name }) {
  return (
    <div className="px-4 py-3 rounded-xl border bg-white text-sm font-medium text-gray-700 grid place-items-center hover:shadow-sm">
      {name}
    </div>
  );
}
function KpiCard({ value, label, note }) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white text-center">
      <div className="text-3xl font-black text-red-700">{value}</div>
      <div className="mt-1 font-semibold">{label}</div>
      <div className="mt-1 text-xs text-gray-500">{note}</div>
    </div>
  );
}

/* ===== Table Helpers (added) ===== */
function Th({ children }) { return <th className="text-left px-4 py-3 font-semibold">{children}</th>; }
function Tr({ children }) { return <tr className="odd:bg-white even:bg-gray-50">{children}</tr>; }
function Td({ children }) { return <td className="px-4 py-3">{children}</td>; }

/* ===== Icons ===== */
function CartIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.5 11H18l2-8H7.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function RocketIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 14l4-4 6-1 4-4-1 6-4 4-6 1z"/><path d="M5 14l-1 5 5-1"/></svg>;}
function PlugIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 7v6M15 7v6"/><path d="M7 13h10v4a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-4z"/></svg>;}
function BellIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8a6 6 0 1 1 12 0v4l2 3H4l2-3z"/><path d="M9 18a3 3 0 0 0 6 0"/></svg>;}
function BoxIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7l9 4 9-4M3 7l9-4 9 4M3 7v10l9 4 9-4V7"/></svg>;}
function RefreshIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4v6h6"/><path d="M20 20v-6h-6"/><path d="M20 9A8 8 0 0 0 6.3 6.3M4 15A8 8 0 0 0 17.7 17.7"/></svg>;}
function ShieldIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/></svg>;}
