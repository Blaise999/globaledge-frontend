// src/pages/info/FAQPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "../../assets/globaledge.png";

export default function FAQPage() {
  const navigate = useNavigate();
  const faqs = [
    {
      q: "How do I ship a package?",
      a: "Go to Services → Express, pick parcel type, enter from/to, weight and dimensions, then generate a label.",
    },
    {
      q: "How long does delivery take?",
      a: "Domestic: 1–3 business days. International Express to UK/EU: typically 3–6 business days. Times are simulated.",
    },
    {
      q: "How do I track?",
      a: "Use the tracking box on the home page or /track and paste an ID (try GE1234567890). You’ll see live status and a map.",
    },
    {
      q: "What if my shipment is stuck at customs?",
      a: "You’ll see an Exception status with an action (e.g., upload invoice). ",
    },
    {
      q: "Do you offer pickups?",
      a: "Yes. From the Dashboard → Pickups tab, request a date, time window, and address. It will appear in your pickup table.",
    },
  ];

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
          <h1 className="text-3xl sm:text-4xl font-black">Frequently Asked Questions</h1>
          <p className="mt-2 text-white/95 max-w-2xl">
            Quick answers to common questions about shipping, tracking, and billing.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border bg-white divide-y">
          {faqs.map((f, i) => (
            <Accordion key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          Still stuck? <Link to="/contact" className="text-red-700 font-semibold hover:underline">Contact support</Link>.
        </div>
      </main>
    </div>
  );
}

function Accordion({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium">{q}</span>
        <span className="text-gray-400">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-4 text-sm text-gray-600">{a}</div>}
    </div>
  );
}
