// src/pages/services/FreightPage.jsx
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/globaledge.png";

export default function FreightPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </a>
            <button
              onClick={() => navigate(-1)}
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

      {/* Hero */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">Freight & Cargo Solutions</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-red-100">
            Air, sea, and road freight for pallets, containers, and oversized cargo—planned by experts and delivered on time.
          </p>

          {/* CTA */}
          <Link
            to="/create?type=freight#quote"
            className="mt-8 inline-block px-6 py-3 rounded-xl bg-white text-red-700 font-semibold hover:bg-gray-100"
          >
            Get a Freight Quote
          </Link>
        </div>
      </section>

      {/* Modes overview */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">Flexible shipping modes</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard title="Air Freight" text="Fastest transit for urgent or high-value cargo." icon={<PlaneIcon />} />
            <InfoCard title="Sea Freight" text="Cost-efficient LCL and FCL for large volumes." icon={<ShipIcon />} />
            <InfoCard title="Road Freight" text="Domestic & regional pallets, LTL/FTL options." icon={<TruckIcon />} />
          </div>
        </div>
      </section>

      {/* Why GlobalEdge Freight */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">Why choose GlobalEdge Freight?</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard title="Global coverage" text="200+ trade lanes via top carriers & port partners." icon={<GlobeIcon />} />
            <InfoCard title="Customs expertise" text="Brokerage, HS codes & compliance handled correctly." icon={<ShieldIcon />} />
            <InfoCard title="Transparent tracking" text="Milestone visibility with proactive updates." icon={<EyeIcon />} />
          </div>
        </div>
      </section>

      {/* Express vs Freight explainer */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">Express vs. Freight — when to choose which?</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Use case</Th><Th>Express (parcel)</Th><Th>Freight (cargo)</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <Tr><Td>Typical weight</Td><Td>Up to ~70 kg per piece</Td><Td>100 kg+ / pallets / containers</Td></Tr>
                <Tr><Td>Speed</Td><Td>24–72h (Priority faster)</Td><Td>Air 2–7d • Road 2–10d • Sea 12–35d</Td></Tr>
                <Tr><Td>Best for</Td><Td>E-commerce, samples, small equipment</Td><Td>Bulk stock, machinery, oversized goods</Td></Tr>
                <Tr><Td>Docs</Td><Td>Label + invoice</Td><Td>Commercial docs, bill of lading/air waybill, etc.</Td></Tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">Times are estimates and vary by lane, weather and customs.</p>
        </div>
      </section>

      {/* Incoterms quick guide */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">Incoterms—who pays for what?</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoCard title="EXW" text="Buyer handles pickup, export & delivery." icon={<TagIcon />} />
            <InfoCard title="FOB" text="Seller handles export to vessel; buyer handles sea & import." icon={<TagIcon />} />
            <InfoCard title="CIF/CIP" text="Seller covers carriage & insurance to destination port." icon={<TagIcon />} />
            <InfoCard title="DAP/DDP" text="We deliver to door; with DDP, duties/taxes included." icon={<TagIcon />} />
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-16 bg-red-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Ready to ship by freight?</h2>
          <p className="mt-3 text-red-100">Tap below to start a freight quote instantly.</p>
          <Link
            to="/create?type=freight#quote"
            className="mt-6 inline-block px-6 py-3 rounded-xl bg-white text-red-700 font-semibold hover:bg-gray-100"
          >
            Start Freight Quote
          </Link>
          <p className="mt-4 text-sm text-red-100">
            Prefer parcels? <Link to="/create?type=parcel#quote" className="underline hover:text-white">Go to Express</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

/* ——— helpers ——— */
function InfoCard({ title, text, icon }) {
  return (
    <div className="p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 grid place-items-center">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  );
}
function Th({ children }) { return <th className="text-left px-4 py-3 font-semibold">{children}</th>; }
function Tr({ children }) { return <tr className="odd:bg-white even:bg-gray-50">{children}</tr>; }
function Td({ children }) { return <td className="px-4 py-3">{children}</td>; }

/* icons */
function PlaneIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 16l20-8-9 12-2-6-6-2z"/></svg>;}
function ShipIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12l9-9 9 9M4 10h16v10H4z"/></svg>;}
function TruckIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="5" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v5h-7z"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/></svg>;}
function GlobeIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>;}
function ShieldIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/></svg>;}
function EyeIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;}
function TagIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12l9-9 9 9-9 9-9-9z"/></svg>;}
