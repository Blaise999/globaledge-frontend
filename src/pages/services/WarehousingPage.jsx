// src/pages/services/WarehousingPage.jsx
import React, { useState } from "react";
import Logo from "../../assets/globaledge.png";

// ==== Images (add these files to src/assets) ====
import WarehouseImg from "../../assets/warehouse.png";
import InboundImg from "../../assets/inbound.png";
import BinShelfImg from "../../assets/bin_shelf.png";
import PalletRackingImg from "../../assets/pallet_racking.png";
import ClimateControlImg from "../../assets/climate_control.png";
import NetworkMapImg from "../../assets/network_map.png";
import OnboardingImg from "../../assets/onboarding.png";
import PackingImg from "../../assets/packing.png";
import DispatchImg from "../../assets/dispatch.png";
import D2CCosmeticsImg from "../../assets/d2c_cosmetics.png";
import ElectronicsB2BImg from "../../assets/electronics_b2b.png";
import ApparelDropImg from "../../assets/apparel_drop.png";
import MarketplacePrepImg from "../../assets/marketplace_prep.png";

export default function WarehousingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
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
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,white,transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/15 ring-1 ring-white/25">
                <WarehouseIcon /> Smart Warehousing & Fulfilment
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">
                Warehousing that scales with your demand.
              </h1>
              <p className="mt-4 text-red-100 max-w-prose">
                From inbound receiving to pick/pack/ship and returns processing—GlobalEdge
                provides modern facilities, accurate SLAs, and real-time visibility.
              </p>

              <dl className="mt-8 grid grid-cols-3 gap-4 text-sm">
                <Stat label="Accuracy" value="99.8%+ picks" />
                <Stat label="Network" value="20+ sites" />
                <Stat label="Cut-off" value="Late same-day" />
              </dl>
            </div>

            {/* Hero image */}
            <div className="rounded-3xl overflow-hidden ring-1 ring-white/25 p-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/10">
                <img
                  src={WarehouseImg}
                  alt="Warehouse floor with racks and AMRs"
                  className="h-full w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Capabilities ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What we do inside the four walls</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Feature icon={<PalletIcon />}   title="Inbound & putaway" text="ASN-based receiving, QC, and slotting by velocity." />
            <Feature icon={<CartIcon />}     title="Pick, pack & ship" text="Batch/zone picking, scan-to-pack, branded inserts." />
            <Feature icon={<SnowflakeIcon />}title="Special handling"  text="Fragile, kitted SKUs, gift wrap, lot/expiry and cold chain*." />
            <Feature icon={<ReturnIcon />}   title="Returns processing" text="RMA validation, grading, refurbishment, restock or recycle." />
            <Feature icon={<AnalyticsIcon /> }title="Inventory control" text="Cycle counts, FIFO/FEFO, serialization, inventory health." />
            <Feature icon={<ShieldIcon />}   title="Security & safety" text="CCTV, access control, H&S training, insured facilities." />
          </div>

          {/* Wide image strip (Inbound) */}
          <div className="mt-8 rounded-3xl overflow-hidden border">
            <div className="aspect-[21/9] w-full">
              <img
                src={InboundImg}
                alt="Inbound receiving and sorting conveyor"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Storage solutions (with real images) ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Storage that fits your SKUs</h2>

          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <StorageCard
              title="Bin & shelf"
              text="Small items with fast turns—great for D2C and accessories."
              imageSrc={BinShelfImg}
              alt="Bins and shelves fast pick faces"
            />
            <StorageCard
              title="Pallet racking"
              text="Bulky cases and reserve stock—standard 1.2×1.0m pallets."
              imageSrc={PalletRackingImg}
              alt="Selective pallet racking"
            />
            <StorageCard
              title="Climate control*"
              text="Temperature-controlled zones for sensitive goods."
              imageSrc={ClimateControlImg}
              alt="Climate controlled storage area"
            />
          </div>

          <p className="mt-3 text-xs text-gray-500">*Availability varies by site and product category.</p>
        </div>
      </section>

      {/* ===== Network & visibility ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Network reach & real-time tracking</h2>
            <p className="mt-3 text-gray-600">
              Place inventory close to customers and ship faster at lower cost. Our WMS provides
              live stock levels, order statuses, and SLA dashboards.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2"><CheckIcon /> Multi-node inventory balancing</li>
              <li className="flex items-start gap-2"><CheckIcon /> Portal & API for orders, stock, and returns</li>
              <li className="flex items-start gap-2"><CheckIcon /> Carrier-agnostic routing for speed/cost</li>
            </ul>
          </div>

          <div className="rounded-3xl overflow-hidden border">
            <div className="aspect-[4/3] w-full">
              <img
                src={NetworkMapImg}
                alt="Fulfilment nodes and service heatmap"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== How it works (timeline + images) ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How we onboard & run</h2>

          <div className="mt-10 grid lg:grid-cols-4 gap-6">
            <Step index={1} title="Plan" text="SKU analysis, slotting model, SLA alignment." />
            <Step index={2} title="Integrate" text="Connect store/WMS via API or EDI." />
            <Step index={3} title="Receive" text="Inbound ASN, QC, putaway to locations." />
            <Step index={4} title="Go live" text="Pick/pack/ship with continuous KPIs." />
          </div>

          {/* Image grid under steps */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <ImgCard src={OnboardingImg} alt="Onboarding workshop" />
            <ImgCard src={PackingImg} alt="Packing stations" />
            <ImgCard src={DispatchImg} alt="Manifest and dispatch" />
          </div>
        </div>
      </section>

      {/* ===== SLAs & service table ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Fulfilment SLAs</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <Th>Metric</Th>
                  <Th>Standard</Th>
                  <Th>Priority</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <Tr><Td>Pick accuracy</Td>      <Td>99.5%</Td>   <Td>99.8%+</Td></Tr>
                <Tr><Td>Same-day cut-off</Td>   <Td>14:00</Td>   <Td>18:00</Td></Tr>
                <Tr><Td>Dock to stock</Td>      <Td>&lt; 24h</Td> <Td>&lt; 12h</Td></Tr>
                <Tr><Td>Return processing</Td>  <Td>48h</Td>     <Td>24h</Td></Tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            SLAs vary by site and seasonality. Confirm during onboarding.
          </p>
        </div>
      </section>

      {/* ===== Gallery / Case studies ===== */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Inside the operation</h2>
          <div className="mt-6 grid md:grid-cols-4 gap-4">
            <SquareImg src={D2CCosmeticsImg} alt="D2C cosmetics case" />
            <SquareImg src={ElectronicsB2BImg} alt="Electronics B2B case" />
            <SquareImg src={ApparelDropImg} alt="Apparel season drop case" />
            <SquareImg src={MarketplacePrepImg} alt="Marketplace prep case" />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-r from-red-700 to-red-600 text-white text-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_right,white,transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold">Ready to level up fulfilment?</h2>
          <p className="mt-3 text-red-100">
            Talk to our team about sites, SLAs, and onboarding timelines.
          </p>
          <a
            href="/services/express?type=parcel#quote"
            className="mt-6 inline-block px-8 py-3 rounded-xl bg-white text-red-700 font-bold shadow hover:scale-105 transition"
          >
            Get Shipping Rates
          </a>
        </div>
      </section>
    </div>
  );
}

/* ================== Small helpers ================== */

function Feature({ icon, title, text }) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition">
      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 grid place-items-center">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{text}</p>
    </div>
  );
}

function StorageCard({ title, text, imageSrc, alt }) {
  return (
    <article className="rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition">
      <div className="aspect-[16/10] w-full">
        <img src={imageSrc} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="p-5">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{text}</p>
      </div>
    </article>
  );
}

function ImgCard({ src, alt }) {
  return (
    <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border bg-white">
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

function SquareImg({ src, alt }) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-2xl border bg-white">
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

/* ✅ ADDED: Step component (this was missing) */
function Step({ index, title, text }) {
  return (
    <div className="relative bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition">
      <div className="absolute -top-4 left-6 w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white font-bold">
        {index}
      </div>
      <h3 className="mt-6 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
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

function Th({ children }) { return <th className="text-left px-4 py-3 font-semibold">{children}</th>; }
function Tr({ children }) { return <tr className="odd:bg-white even:bg-gray-50">{children}</tr>; }
function Td({ children }) { return <td className="px-4 py-3">{children}</td>; }

/* ================== Icons ================== */
function WarehouseIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M7 22V12h10v10"/></svg>;}
function PalletIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="10" rx="2"/><path d="M3 18h18M7 18v2M12 18v2M17 18v2"/></svg>;}
function CartIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.5 11H18l2-8H7.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function ReturnIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 10l-4 4 4 4"/><path d="M5 14h8a6 6 0 1 0 0-12H9"/></svg>;}
function AnalyticsIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="10" width="4" height="10" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="17" rx="1"/></svg>;}
function ShieldIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/></svg>;}
function SnowflakeIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2v20M2 12h20M4 6l16 12M20 6L4 18"/></svg>;}
function CheckIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
