// src/pages/billing/ReceiptPage.jsx
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../../assets/globaledge.png";

import { bookFromDraft, getUserToken } from "../../utils/api";
import { loadDraft, clearDraft } from "../../utils/storage"; // make sure you have these

function tryParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ✅ refresh-safe best-effort restore (doesn't depend on your utils/storage)
function readReceiptFromStorage(id) {
  if (typeof window === "undefined") return null;
  const keysToTry = [
    `ge_receipt_${id}`,
    `receipt_${id}`,
    "ge_receipt",
    "last_receipt",
    "receipt",
  ];

  for (const store of [window.sessionStorage, window.localStorage]) {
    for (const k of keysToTry) {
      const raw = store.getItem(k);
      if (!raw) continue;
      const parsed = tryParse(raw);
      if (!parsed) continue;

      // if it's a list, find by id
      if (Array.isArray(parsed)) {
        const found = parsed.find((r) => String(r?.id) === String(id));
        if (found) return found;
      }

      // if it's an object receipt
      if (parsed && typeof parsed === "object") {
        if (String(parsed?.id) === String(id)) return parsed;
        // sometimes people store as {receipt:{...}}
        if (parsed?.receipt && String(parsed.receipt?.id) === String(id)) return parsed.receipt;
      }
    }
  }
  return null;
}

export default function ReceiptPage() {
  const { id } = useParams(); // receipt id (client-side)
  const { state } = useLocation();
  const navigate = useNavigate();

  // ✅ try state first, then storage fallback
  const receipt = state?.receipt || readReceiptFromStorage(id);

  // If user refreshed and we lost everything, nudge back
  if (!receipt) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold">Receipt unavailable</h1>
          <p className="mt-2 text-gray-600">We couldn’t restore the receipt details.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button className="px-4 py-2 rounded-lg border" onClick={() => navigate(-1)}>
              Go back
            </button>
            <Link className="px-4 py-2 rounded-lg bg-red-600 text-white" to="/services/express">
              New quote
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { quote, totals, method, maskedCard, ts } = receipt;

  // --- Tracking / booking state ---
  const [trackingId, setTrackingId] = useState(receipt.trackingId || "");
  const [shipmentId, setShipmentId] = useState(receipt.shipmentId || "");
  const [loadingTrack, setLoadingTrack] = useState(!receipt.trackingId);
  const [trackErr, setTrackErr] = useState("");
  const bookedRef = useRef(false); // prevent duplicate booking on fast reloads

  // ✅ pull contacts if Billing included them
  const contacts = receipt.contacts || receipt.contact || {};

  // ✅ pull goods photos (either urls or meta)
  const goodsPhotosMeta = Array.isArray(receipt.goodsPhotosMeta) ? receipt.goodsPhotosMeta : [];
  const goodsPhotos = Array.isArray(receipt.goodsPhotos)
    ? receipt.goodsPhotos
    : goodsPhotosMeta
        .map((p) => (typeof p === "string" ? p : p?.url))
        .filter(Boolean);

  // If no trackingId, try to book the shipment from the saved draft (session/local storage)
  useEffect(() => {
    if (trackingId || bookedRef.current) return;

    const rawDraft = state?.draft || loadDraft();

    if (!rawDraft) {
      setLoadingTrack(false);
      setTrackErr("Missing shipment draft. Please re-create your shipment.");
      return;
    }

    // ✅ normalize photos + shipmentKey so bookFromDraft can pass them through
    const dGoodsMeta = Array.isArray(rawDraft.goodsPhotos) ? rawDraft.goodsPhotos : [];
    const dGoods = dGoodsMeta.map((p) => (typeof p === "string" ? p : p?.url)).filter(Boolean);

    const draft = {
      ...rawDraft,
      shipmentKey: rawDraft.shipmentKey || "",
      goodsPhotos: dGoodsMeta,
      goodsPhotosMeta: dGoodsMeta, // optional
      goodsPhotosUrls: dGoods, // optional helper
    };

    (async () => {
      try {
        setLoadingTrack(true);
        setTrackErr("");

        bookedRef.current = true;

        const created = await bookFromDraft(draft, getUserToken());

        const tid = created?.trackingNumber || created?.tracking || created?.trackingId || created?.id;
        if (!tid) throw new Error("No tracking number returned by server.");

        setTrackingId(String(tid));
        setShipmentId(String(created?._id || created?.id || ""));

        // Clear draft so refresh doesn’t rebook
        clearDraft();

        // Patch history state so UI has the IDs
        navigate(".", {
          replace: true,
          state: {
            receipt: {
              ...receipt,
              trackingId: String(tid),
              shipmentId: String(created?._id || created?.id || ""),
            },
          },
        });
      } catch (err) {
        setTrackErr(err?.message || "Failed to create shipment.");
      } finally {
        setLoadingTrack(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingId]);

  const headerRight = useMemo(() => {
    const currency = totals?.currency || "EUR";
    const symbol = currency === "BEL" ? "€" : currency === "EUR" ? "€" : `${currency} `;
    return `${symbol}${fmt(totals?.total ?? 0)}`;
  }, [totals]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] uppercase tracking-wide text-gray-500">Total paid</div>
                <div className="text-base font-extrabold">{headerRight}</div>
              </div>
              <Link to="/track" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm">
                Track
              </Link>
              <Link to="/dashboard" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tracking bar */}
      <div className="sticky top-14 z-30 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="text-xs font-semibold text-gray-600">Tracking ID</div>
            <div className="flex-1 flex items-stretch gap-2">
              <div className="flex-1 relative">
                <input
                  readOnly
                  value={loadingTrack ? "Creating shipment…" : trackErr ? "—" : trackingId || "Not available"}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm pr-28"
                />
                {loadingTrack && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Loading…</span>
                )}
                {trackErr && !loadingTrack && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600">Error</span>
                )}
              </div>
              <button
                type="button"
                className="px-3.5 py-2.5 rounded-xl border text-sm hover:bg-gray-50"
                onClick={() => {
                  if (!trackingId) return;
                  if (navigator.clipboard) navigator.clipboard.writeText(trackingId);
                }}
                disabled={!trackingId}
                title="Copy tracking ID"
              >
                Copy
              </button>
              <Link
                to={trackingId ? `/track?ref=${encodeURIComponent(trackingId)}` : "#"}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  trackingId ? "bg-black text-white hover:bg-gray-900" : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
                aria-disabled={!trackingId}
              >
                Track
              </Link>
            </div>
          </div>
          {trackErr && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {trackErr} You can still track later from your dashboard.
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border bg-white p-6">
          {/* Heading row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold">Payment successful</h1>
              <div className="text-sm text-gray-500">
                Receipt #{id} • {new Date(ts).toLocaleString()}
                {shipmentId && <span className="ml-2 text-gray-400">• Shipment ID: {shorten(shipmentId)}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Total paid</div>
              <div className="text-2xl font-extrabold">{headerRight}</div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <section className="rounded-xl border p-4">
              <h3 className="font-semibold">Shipment</h3>
              <dl className="mt-2 text-sm grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-gray-500">From</dt>
                  <dd className="font-medium">{quote.from}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">To</dt>
                  <dd className="font-medium">{quote.to}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Service</dt>
                  <dd className="font-medium">{quote.service}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Weight</dt>
                  <dd className="font-medium">{quote.weightKg} kg</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500">Tracking ID</dt>
                  <dd className="font-medium">{trackingId || (loadingTrack ? "Creating…" : "—")}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border p-4">
              <h3 className="font-semibold">Payment</h3>
              <div className="mt-2 text-sm">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="font-medium">{prettyMethod(method)}</span>
                </div>
                {maskedCard && (
                  <div className="flex justify-between">
                    <span>Card</span>
                    <span className="font-medium">{maskedCard}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium text-emerald-600">Succeeded</span>
                </div>
              </div>
              <div className="mt-3">
                <button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-black text-white text-sm">
                  Print / Save PDF
                </button>
              </div>
            </section>
          </div>

          {/* Contacts */}
          <section className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Shipper</h3>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li>
                  <b>{contacts.shipperName || "(name not provided)"}</b>
                </li>
                {contacts.shipperEmail && <li>Email: {contacts.shipperEmail}</li>}
                {contacts.shipperPhone && <li>Phone: {contacts.shipperPhone}</li>}
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Recipient</h3>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li>
                  <b>{contacts.recipientName || "(name not provided)"}</b>
                </li>
                {contacts.recipientPhone && <li>Phone: {contacts.recipientPhone}</li>}
                {contacts.recipientEmail && <li>Email: {contacts.recipientEmail}</li>}
                {contacts.recipientAddress && <li className="text-gray-600">{contacts.recipientAddress}</li>}
              </ul>
            </div>
          </section>

          {/* ✅ Goods photos */}
          {goodsPhotos.length > 0 && (
            <section className="mt-6 rounded-xl border p-4">
              <h3 className="font-semibold">Goods photos</h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {goodsPhotos.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
                      {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                      <img src={url} alt={`Goods photo ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  </a>
                ))}
              </div>
              {goodsPhotosMeta.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  {goodsPhotosMeta.length} file{goodsPhotosMeta.length === 1 ? "" : "s"} attached.
                </div>
              )}
            </section>
          )}

          {/* Charges */}
          <section className="mt-6 rounded-xl border p-4">
            <h3 className="font-semibold">Charges</h3>
            <ul className="mt-2 text-sm space-y-1">
              <li className="flex justify-between">
                <span>Base</span>
                <span>{money(quote.currency, quote.baseUSD)}</span>
              </li>
              <li className="flex justify-between">
                <span>Fuel</span>
                <span>{money(totals.currency, totals.fuel)}</span>
              </li>
              <li className="flex justify-between">
                <span>Security & handling</span>
                <span>{money(totals.currency, totals.security)}</span>
              </li>
              <li className="flex justify-between">
                <span>Insurance</span>
                <span>{money(totals.currency, totals.insurance)}</span>
              </li>
              <li className="flex justify-between text-gray-500">
                <span>Taxes / duties</span>
                <span>{money(totals.currency, totals.tax)}</span>
              </li>
              <li className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="font-extrabold">{money(totals.currency, totals.total)}</span>
              </li>
            </ul>
          </section>

          <div className="mt-6 flex gap-2">
            <Link
              to={trackingId ? `/track?ref=${encodeURIComponent(trackingId)}` : "/track"}
              className={`px-4 py-2 rounded-xl font-semibold ${
                trackingId ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-300 text-gray-700"
              }`}
            >
              Track shipment
            </Link>
            <Link to="/services/express" className="px-4 py-2 rounded-xl border">
              Create another
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function fmt(n) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function money(curr, n) {
  const sym = curr === "BEL" ? "€" : curr === "EUR" ? "€" : curr ? `${curr} ` : "$";
  return `${sym}${fmt(n)}`;
}
function prettyMethod(m) {
  switch (m) {
    case "card":
      return "Card";
    case "paypal":
      return "PayPal";
    case "bank":
      return "Bank transfer";
    case "cod":
      return "Pay on delivery";
    default:
      return m || "—";
  }
}
function shorten(id) {
  return String(id).slice(0, 6) + "…" + String(id).slice(-4);
}
