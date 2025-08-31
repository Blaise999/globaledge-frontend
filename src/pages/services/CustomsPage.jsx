// src/pages/services/CustomsPage.jsx
import React, { useState } from "react";
import Logo from "../../assets/globaledge.png";

export default function CustomsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== Header ===== */}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">Customs & Clearance</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-red-100">
            GlobalEdge ensures smooth cross-border trade with expert customs clearance,
            compliance guidance, and duty optimization — so your cargo moves without delays.
          </p>
        </div>
      </section>

      {/* ===== Why Customs Support ===== */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold">Why customs support matters</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard title="Fewer delays" text="Correct paperwork reduces port/airport holds." icon={<ClockIcon />} />
            <InfoCard title="Cost savings" text="Optimized HS codes and duties cut expenses." icon={<DollarIcon />} />
            <InfoCard title="Risk reduction" text="Stay compliant with evolving trade regulations." icon={<ShieldIcon />} />
          </div>
        </div>
      </section>

      {/* ===== Process ===== */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold">How clearance works</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Step index={1} title="Document prep" text="Commercial invoices, HS codes, permits prepared upfront." />
            <Step index={2} title="Submission" text="We file entries with customs authorities digitally." />
            <Step index={3} title="Release & delivery" text="Cargo cleared and released for final delivery." />
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold">Common questions</h2>
          <div className="mt-6 divide-y border rounded-xl">
            <FaqItem q="What documents are needed for clearance?" a="Commercial invoice, packing list, and depending on goods — certificates or permits." />
            <FaqItem q="Do you handle duty & tax payments?" a="Yes, we can arrange DDU (duties unpaid) or DDP (duties prepaid by shipper)." />
            <FaqItem q="Which countries do you cover?" a="We clear shipments globally — including complex markets in Asia, Africa, and LATAM." />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 bg-red-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Ship with confidence</h2>
          <p className="mt-3 text-red-100">Let GlobalEdge handle your customs so you can focus on your business.</p>
          <a
            href="/services/express?type=parcel#quote"
            className="mt-6 inline-block px-6 py-3 rounded-xl bg-white text-red-700 font-semibold hover:bg-gray-100"
          >
            Start Shipping
          </a>
        </div>
      </section>
    </div>
  );
}

/* ----------------- Reusable Components ----------------- */
function InfoCard({ title, text, icon }) {
  return (
    <div className="p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 grid place-items-center">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  );
}

function Step({ index, title, text }) {
  return (
    <div className="relative p-6 rounded-2xl border bg-white shadow-sm">
      <div className="absolute -top-3 left-4 text-red-600 font-bold text-xl">{index}</div>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{text}</p>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-4 px-4 text-left text-sm font-medium hover:bg-gray-50"
      >
        <span>{q}</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-600">{a}</div>}
    </div>
  );
}

/* ----------------- Icons ----------------- */
function ClockIcon() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>;
}
function DollarIcon() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>;
}
function ShieldIcon() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
  </svg>;
}
