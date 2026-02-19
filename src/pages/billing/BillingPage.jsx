// src/pages/billing/BillingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/globaledge.png";
import { getDraft, clearDraft, saveReceipt } from "../../utils/storage";
import { shipments } from "../../utils/api";

/* ---------- env ---------- */
const IS_DEV = import.meta.env.MODE !== "production";

/* ---------- UI helpers ---------- */
const INPUT =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition";
const LABEL = "block text-xs font-semibold text-gray-600 mb-1.5";

/* ---------- map draft -> summary ---------- */
function toSummary(draft) {
  if (!draft) return null;

  const common = {
    from: draft.from,
    to: draft.to,
    etaText: draft.eta || "—",
    currency: draft.currency || "EUR",
    baseUSD: Number(draft.price || 0),
    recipientEmail: draft.recipientEmail || "",
    recipientAddress: draft.recipientAddress || "",
  };

  if (draft.serviceType === "freight") {
    const f = draft.freight || {};
    return {
      ...common,
      mode: `Freight (${f.mode || "air"})`,
      service: "Standard",
      weightKg: Number(f.weight || 0) * Number(f.pallets || 1),
      dimsCm: { l: f.length, w: f.width, h: f.height },
    };
  }

  const p = draft.parcel || {};
  return {
    ...common,
    mode: "Parcel",
    service: p.level || "express",
    weightKg: Number(p.weight || 0),
    dimsCm: { l: p.length, w: p.width, h: p.height },
  };
}

export default function BillingPage() {
  const navigate = useNavigate();

  const [draft, setDraft] = useState(null);
  useEffect(() => {
    const d = getDraft();
    setDraft(d);
    if (!d) navigate("/services/express", { replace: true });
  }, [navigate]);

  const q = toSummary(draft) || {};

  // 👇 pull contact fields (either top-level or inside draft.contact)
  const c = draft?.contact || {};
  const shipperName = draft?.shipperName ?? c.shipperName ?? c.name ?? "";
  const shipperEmail = draft?.shipperEmail ?? c.shipperEmail ?? c.email ?? "";
  const shipperPhone = draft?.shipperPhone ?? c.shipperPhone ?? c.phone ?? "";

  const recipientName = draft?.recipientName ?? c.recipientName ?? "";
  const recipientPhone = draft?.recipientPhone ?? c.recipientPhone ?? "";

  const [method, setMethod] = useState("card");
  const [insure, setInsure] = useState(false);
  const [cardOk, setCardOk] = useState(false);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");

  const baseTotals = useMemo(() => {
    const base = Number(q.baseUSD || 0);
    const fuel = base * 0.12;
    const security = base * 0.015;
    const insurance = insure ? Math.max(1.5, base * 0.01) : 0;
    const tax = 0;
    const subtotal = round2(base + fuel + security + insurance + tax);
    return {
      fuel: round2(fuel),
      security: round2(security),
      insurance: round2(insurance),
      tax: round2(tax),
      subtotal,
    };
  }, [q.baseUSD, insure]);

  const codFee = method === "cod" ? round2(baseTotals.subtotal * 0.2) : 0;
  const grandTotal = round2(baseTotals.subtotal + codFee);

  async function onConfirm(e) {
    e.preventDefault();
    if (paying) return;
    if (method === "card" && !cardOk && !IS_DEV) return;
    if (!draft) return;

    setErr("");
    setPaying(true);

    // ✅ normalize goods photos so backend always gets clean arrays
    const goodsPhotosMeta = Array.isArray(draft.goodsPhotos) ? draft.goodsPhotos : [];
    const goodsPhotos = goodsPhotosMeta
      .map((p) => (typeof p === "string" ? p : p?.url))
      .filter(Boolean);

    const shipmentKey = draft.shipmentKey || "";

    // payload expected by backend + contacts (+ photos)
    const payload =
      draft.serviceType === "freight"
        ? {
            serviceType: "freight",
            from: draft.from,
            to: draft.to,
            serviceLevel: "standard",
            recipientEmail: draft.recipientEmail || "",
            recipientAddress: draft.recipientAddress || "",
            freight: draft.freight,

            currency: draft.currency,
            price: draft.price,
            eta: draft.eta,
            billable: draft.billable,
            paymentMethod: method,

            // ✅ IMPORTANT: persist these
            shipmentKey,
            goodsPhotos, // safest for DB (string[])
            goodsPhotosMeta, // optional (keeps name/size if you stored it)

            contact: {
              shipperName,
              shipperEmail,
              shipperPhone,
              recipientName,
              recipientPhone,
              // convenient fallbacks for your server linker:
              name: shipperName,
              email: shipperEmail,
              phone: shipperPhone,
            },
          }
        : {
            serviceType: "parcel",
            from: draft.from,
            to: draft.to,
            serviceLevel: draft.parcel?.level || "standard",
            recipientEmail: draft.recipientEmail || "",
            recipientAddress: draft.recipientAddress || "",
            parcel: draft.parcel,

            currency: draft.currency,
            price: draft.price,
            eta: draft.eta,
            billable: draft.billable,
            paymentMethod: method,

            // ✅ IMPORTANT: persist these
            shipmentKey,
            goodsPhotos,
            goodsPhotosMeta,

            contact: {
              shipperName,
              shipperEmail,
              shipperPhone,
              recipientName,
              recipientPhone,
              name: shipperName,
              email: shipperEmail,
              phone: shipperPhone,
            },
          };

    try {
      const TIMEOUT_MS = 12000;
      const created = await Promise.race([
        shipments.create(payload),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("Request timed out. Please try again.")), TIMEOUT_MS)
        ),
      ]);

      // build receipt that carries contacts + photos (offline friendly)
      const receipt = {
        id: created?._id || created?.id || `GE-${Date.now()}`,
        quote: {
          mode: q.mode,
          service: q.service,
          from: q.from,
          to: q.to,
          weightKg: q.weightKg,
          dimsCm: q.dimsCm,
          etaText: created?.eta || q.etaText || draft.eta || "—",
          baseUSD: q.baseUSD,
          currency: q.currency || draft.currency || "EUR",
        },
        totals: {
          ...baseTotals,
          codFee,
          total: grandTotal,
          currency: q.currency || draft.currency || "EUR",
        },
        method,
        ts: new Date().toISOString(),
        shipmentId: created?._id || created?.id,
        trackingId: created?.trackingNumber || created?.tracking || created?.trackingId || "",
        contacts: {
          shipperName,
          shipperEmail,
          shipperPhone,
          recipientName,
          recipientPhone,
          recipientEmail: q.recipientEmail,
          recipientAddress: q.recipientAddress,
        },

        // ✅ keep for receipt UI + debugging
        shipmentKey,
        goodsPhotos,
        goodsPhotosMeta,
      };

      clearDraft();
      saveReceipt(receipt);
      navigate(`/receipt/${receipt.id}`, { replace: true, state: { receipt } });
    } catch (e) {
      console.error("Create shipment failed:", e);
      setErr(e?.message || "Could not create shipment. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={Logo} alt="GlobalEdge" className="h-9 w-auto object-contain" />
            <span className="font-bold text-lg text-gray-800">GlobalEdge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/services/express" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Back to quote
            </Link>
            <Link to="/track" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Track
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left */}
          <section className="lg:col-span-7 space-y-8">
            {/* Summary */}
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Shipment summary</h2>
              <dl className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
                <Info label="Mode" value={q.mode} />
                <Info label="Service" value={String(q.service).toUpperCase()} />
                <Info label="From" value={q.from} />
                <Info label="To" value={q.to} />
                <Info label="Weight" value={`${q.weightKg ?? 0} kg`} />
                <Info
                  label="Dimensions"
                  value={`${q.dimsCm?.l ?? "-"}×${q.dimsCm?.w ?? "-"}×${q.dimsCm?.h ?? "-"} cm`}
                />
                <Info label="Recipient email" value={q.recipientEmail || "—"} />
                <Info label="Recipient address" value={q.recipientAddress || "—"} />
                <Info label="ETA" value={q.etaText || "—"} />
              </dl>

              {/* Contacts block */}
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <ContactCard
                  title="Shipper"
                  name={shipperName || "(name not provided)"}
                  lines={[
                    shipperEmail ? `Email: ${shipperEmail}` : null,
                    shipperPhone ? `Phone: ${shipperPhone}` : null,
                  ]}
                />
                <ContactCard
                  title="Recipient"
                  name={recipientName || "(name not provided)"}
                  lines={[
                    recipientPhone ? `Phone: ${recipientPhone}` : null,
                    q.recipientEmail ? `Email: ${q.recipientEmail}` : null,
                  ]}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Payment method</h2>
                {IS_DEV && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    DEV (card validation bypass)
                  </span>
                )}
              </div>

              <form className="mt-5 space-y-5" onSubmit={onConfirm}>
                <div className="space-y-3 text-sm">
                  {["card", "cod"].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="method"
                        className="accent-red-600"
                        checked={method === opt}
                        onChange={() => {
                          setMethod(opt);
                          setCardOk(opt !== "card");
                        }}
                      />
                      <span className="capitalize">
                        {opt === "cod" ? "Pay on delivery (+20%)" : "Credit / Debit card"}
                      </span>
                    </label>
                  ))}
                </div>

                {method === "card" && <CardFields onValidityChange={setCardOk} />}

                {method === "cod" && (
                  <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="font-semibold mb-1">Pay on Delivery (COD)</div>
                    <p>
                      A <b>20% COD service fee</b> will be applied.
                    </p>
                  </div>
                )}

                <label className="mt-1 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-red-600"
                    checked={insure}
                    onChange={(e) => setInsure(e.target.checked)}
                  />
                  Add shipment insurance (1% of base, min $1.50)
                </label>

                {err && <div className="text-sm text-red-700 bg-red-50 border px-3 py-2">{err}</div>}

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={paying || (method === "card" && !cardOk && !IS_DEV)}
                    className={
                      "flex-1 rounded-xl font-semibold py-3 transition " +
                      ((method === "card" && !cardOk && !IS_DEV) || paying
                        ? "bg-red-300 text-white cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700")
                    }
                  >
                    {paying ? "Processing…" : "Confirm & Book"}
                  </button>
                  <Link to="/services/express" className="px-4 py-3 rounded-xl border text-sm font-medium hover:bg-gray-50">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </section>

          {/* Right - costs */}
          <aside className="lg:col-span-5">
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Charges breakdown</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <Cost label="Base" value={q.baseUSD} />
                <Cost label="Fuel surcharge (12%)" value={baseTotals.fuel} />
                <Cost label="Security & handling (1.5%)" value={baseTotals.security} />
                <Cost label="Insurance" value={baseTotals.insurance} />
                <Cost label="Taxes / duties" value={baseTotals.tax} muted />
                {method === "cod" && <Cost label="Pay on delivery fee (20%)" value={codFee} highlight />}
              </ul>
              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-gray-600">Total due</span>
                <span className="text-2xl font-bold text-gray-900">
                  {q.currency === "BEL" ? "€" : q.currency === "EUR" ? "€" : `${q.currency} `}
                  {fmt(grandTotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">ETA: {q.etaText}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ---------- small UI bits ---------- */
const Info = ({ label, value }) => (
  <div>
    <dt className="text-gray-500">{label}</dt>
    <dd className="font-medium text-gray-900">{String(value ?? "—")}</dd>
  </div>
);

const Cost = ({ label, value, muted, highlight }) => (
  <li className="flex justify-between items-center">
    <span className={(muted ? "text-gray-500" : "text-gray-700") + (highlight ? " font-semibold" : "")}>
      {label}
    </span>
    <span className={(muted ? "text-gray-500" : "font-medium") + (highlight ? " text-amber-700" : "")}>
      ${fmt(value)}
    </span>
  </li>
);

function ContactCard({ title, name, lines = [] }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="font-semibold">{name || "-"}</div>
      <ul className="mt-1 text-xs text-gray-600 space-y-0.5">
        {lines.filter(Boolean).map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/* =================================================================== */
/* ================  INLINE CREDIT CARD INPUTS (no libs) ============== */
/* =================================================================== */

function CardFields({ onValidityChange }) {
  const [number, setNumber] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [vat, setVat] = useState("");

  const brand = detectBrand(number);
  const isNumberValid = luhnValid(number) && validLengthForBrand(number, brand);
  const isExpiryValid = expiryValid(expiry);
  const isCvcValid = cvcValid(cvc, brand);
  const nameOk = (first + " " + last).trim().length > 1;

  const allValid = isNumberValid && isExpiryValid && isCvcValid && nameOk;

  useEffect(() => onValidityChange?.(allValid), [allValid, onValidityChange]);

  return (
    <div className="mt-4 space-y-5">
      {/* Card number with inline brand + lock */}
      <div>
        <label className={LABEL}>Card number</label>
        <div className="relative">
          <input
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            className={INPUT + (number && !isNumberValid ? " ring-1 ring-red-500" : "") + " pr-28"}
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          />
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <BrandBadgeColored brand={brand} />
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17 9h-1V7a4 4 0 10-8 0v2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2zm-8-2a3 3 0 116 0v2H9V7zm9 12H6v-8h12v8z" />
            </svg>
          </div>
        </div>
        {!isNumberValid && number.length > 0 && <p className="mt-1 text-xs text-red-600">Enter a valid card number.</p>}
      </div>

      {/* expiry + cvc row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>MM/YY</label>
          <input
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            className={INPUT + (expiry && !isExpiryValid ? " ring-1 ring-red-500" : "")}
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          />
          {!isExpiryValid && expiry.length > 0 && <p className="mt-1 text-xs text-red-600">Use a valid future date.</p>}
        </div>
        <div>
          <label className={LABEL}>CVV</label>
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === "amex" ? "4 digits" : "3 digits"}
            className={INPUT + (cvc && !isCvcValid ? " ring-1 ring-red-500" : "")}
            value={cvc}
            onChange={(e) => setCvc(formatCvc(e.target.value, brand))}
          />
          {!isCvcValid && cvc.length > 0 && <p className="mt-1 text-xs text-red-600">Invalid CVC.</p>}
        </div>
      </div>

      {/* name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>First name</label>
          <input autoComplete="cc-given-name" placeholder="John" className={INPUT} value={first} onChange={(e) => setFirst(e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Last name</label>
          <input autoComplete="cc-family-name" placeholder="Doe" className={INPUT} value={last} onChange={(e) => setLast(e.target.value)} />
        </div>
      </div>

      {/* country + VAT (optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Country/Region</label>
          <select className={INPUT} value={country} onChange={(e) => setCountry(e.target.value)}>
            {["Germany", "Belgium", "Ghana", "Kenya", "South Africa", "United States", "United Kingdom", "Canada"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>VAT ID (optional)</label>
          <input className={INPUT} placeholder="e.g. US-0123456789" value={vat} onChange={(e) => setVat(e.target.value)} />
        </div>
      </div>

      <AcceptedRow />
    </div>
  );
}

/* ---------- Colored Accepted badges ---------- */
function AcceptedRow() {
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
      <span className="mr-1">Accepted:</span>
      <BrandBadgeColored brand="visa">
        <VisaColor />
      </BrandBadgeColored>
      <BrandBadgeColored brand="mastercard">
        <MastercardColor />
      </BrandBadgeColored>
      <BrandBadgeColored brand="verve">
        <VerveColor />
      </BrandBadgeColored>
      <BrandBadgeColored brand="amex">
        <AmexColor />
      </BrandBadgeColored>
    </div>
  );
}

function BrandBadgeColored({ brand, children }) {
  const key = (brand || "card").toLowerCase();
  const label = key.toUpperCase();

  let AutoIcon = null;
  if (!children) {
    if (key === "visa") AutoIcon = VisaColor;
    else if (key === "mastercard") AutoIcon = MastercardColor;
    else if (key === "amex") AutoIcon = AmexColor;
    else if (key === "verve") AutoIcon = VerveColor;
    else AutoIcon = CardGenericIcon;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm" aria-label={label} title={label}>
      <span className="inline-block h-4 w-8">{children ? children : <AutoIcon />}</span>
      <span className="hidden sm:inline text-[10px] font-semibold uppercase text-gray-700">{label}</span>
    </span>
  );
}

function CardGenericIcon() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-8" aria-hidden="true">
      <rect x="0" y="0" width="48" height="16" rx="3" fill="#F3F4F6" />
      <rect x="6" y="5" width="36" height="3" rx="1.5" fill="#9CA3AF" />
      <rect x="6" y="10" width="18" height="2" rx="1" fill="#D1D5DB" />
    </svg>
  );
}

/* --- Colored SVGs --- */
function VisaColor() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-8" aria-hidden="true">
      <rect x="0" y="0" width="48" height="16" rx="3" fill="#1A1F71" />
      <text x="9" y="11" fontSize="9" fontWeight="700" fill="#FFFFFF" letterSpacing="1">
        VISA
      </text>
    </svg>
  );
}
function MastercardColor() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-8" aria-hidden="true">
      <rect x="0" y="0" width="48" height="16" rx="3" fill="#FFFFFF" />
      <circle cx="20" cy="8" r="5" fill="#EB001B" />
      <circle cx="28" cy="8" r="5" fill="#F79E1B" />
    </svg>
  );
}
function AmexColor() {
  return (
    <svg viewBox="0 0 56 16" className="h-4 w-12" aria-hidden="true">
      <rect x="0" y="0" width="56" height="16" rx="3" fill="#2E77BC" />
      <text x="8" y="11" fontSize="8.5" fontWeight="800" fill="#FFFFFF" letterSpacing="1">
        AMEX
      </text>
    </svg>
  );
}
function VerveColor() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-8" aria-hidden="true">
      <rect x="0" y="0" width="48" height="16" rx="3" fill="#FFFFFF" />
      <rect x="12" y="4" width="18" height="8" rx="4" fill="#2DB742" />
      <circle cx="34" cy="8" r="3" fill="#E30613" />
    </svg>
  );
}

/* ---------- card formatters & validation ---------- */
function onlyDigits(v) {
  return (v || "").replace(/\D+/g, "");
}
function formatCardNumber(v) {
  const d = onlyDigits(v).slice(0, 19);
  const groups = [];
  for (let i = 0; i < d.length; i += 4) groups.push(d.slice(i, i + 4));
  return groups.join(" ");
}
function formatExpiry(v) {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  return d.slice(0, 2) + "/" + d.slice(2);
}
function expiryValid(v) {
  const m = v.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  let mm = parseInt(m[1], 10),
    yy = parseInt(m[2], 10);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const year = now.getFullYear() % 100;
  const month = now.getMonth() + 1;
  if (yy < year) return false;
  if (yy === year && mm < month) return false;
  return true;
}
function formatCvc(v, brand) {
  const max = brand === "amex" ? 4 : 3;
  return onlyDigits(v).slice(0, max);
}
function cvcValid(v, brand) {
  const len = brand === "amex" ? 4 : 3;
  return onlyDigits(v).length === len;
}
function luhnValid(v) {
  const digits = onlyDigits(v);
  if (digits.length < 12) return false;
  let sum = 0,
    alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function detectBrand(v) {
  const d = onlyDigits(v);
  if (/^3[47]/.test(d)) return "amex";
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-7]\d))/.test(d)) return "mastercard";
  if (/^(506(0|1)|507(8|9)|6500|650)/.test(d)) return "verve";
  return null;
}
function validLengthForBrand(v, brand) {
  const len = onlyDigits(v).length;
  if (brand === "amex") return len === 15;
  if (brand === "visa") return len === 13 || len === 16 || len === 19;
  if (brand === "mastercard") return len === 16;
  if (brand === "verve") return len >= 16 && len <= 19;
  return len >= 12;
}

/* ---------- misc helpers ---------- */
function fmt(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}
