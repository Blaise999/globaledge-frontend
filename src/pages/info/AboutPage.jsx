// src/pages/info/AboutPage.jsx
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/globaledge.png";

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </a>
            <div className="flex items-center gap-2">
              <Link to="/contact" className="btn-secondary">Contact</Link>
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-black">About GlobalEdge</h1>
          <p className="mt-2 text-white/95 max-w-2xl">
            We’re a next-gen logistics brand focused on speed, visibility, and a delightful
            shipping experience—built for SMEs and growing e-commerce teams.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card title="Mission">
            Give businesses fast, reliable cross-border delivery with real-time tracking and
            transparent pricing.
          </Card>
          <Card title="Coverage">
            Door-to-door service across major Belgium cities with trusted linehaul to UK, EU,
            and North America hubs.
          </Card>
          <Card title="Support">
            Human support that answers in minutes. Customs help, pickups, and proactive alerts.
          </Card>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Why shippers choose us</h2>
          <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <li className="rounded-xl border p-4">🚀 Express & Priority options</li>
            <li className="rounded-xl border p-4">🛰️ End-to-end tracking</li>
            <li className="rounded-xl border p-4">📦 Smart packaging presets</li>
            <li className="rounded-xl border p-4">🧾 Customs automation (simulated)</li>
            <li className="rounded-xl border p-4">🔔 Email/SMS notifications</li>
            <li className="rounded-xl border p-4">🛠️ Easy business dashboard</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Company details</h2>
          <dl className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Item k="Registered name" v="GlobalEdge Logistics (Simulation)" />
            <Item k="HQ" v="Brussels, Belgium" />
            <Item k="Support hours" v="Mon–Fri, 9:00–18:00 WAT" />
            <Item k="Email" v="support@globaledge.example" />
            <Item k="Phone" v="+44 000 000 0000" />
          </dl>
        </div>
      </main>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <article className="rounded-2xl border bg-white p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{children}</p>
    </article>
  );
}
function Item({ k, v }) {
  return (
    <div className="rounded-xl border p-4">
      <dt className="text-gray-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
