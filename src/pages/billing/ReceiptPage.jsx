// src/pages/billing/ReceiptPage.jsx
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../../assets/globaledge.png";

import { bookFromDraft, shipments, getUserToken } from "../../utils/api";
import { loadDraft, clearDraft } from "../../utils/storage"; // make sure you have these

export default function ReceiptPage(){
  const { id } = useParams(); // receipt id (client-side)
  const { state } = useLocation();
  const navigate = useNavigate();

  // Expect: { id, quote, totals, method, ts, [trackingId], [shipmentId], [draft], [contacts] }
  const receipt = state?.receipt;

  // If user refreshed and we lost the state, nudge back
  if (!receipt) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold">Receipt unavailable</h1>
          <p className="mt-2 text-gray-600">We couldn’t restore the simulated receipt details.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button className="px-4 py-2 rounded-lg border" onClick={()=>navigate(-1)}>Go back</button>
            <Link className="px-4 py-2 rounded-lg bg-red-600 text-white" to="/services/express">New quote</Link>
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

  // If no trackingId, try to book the shipment from the saved draft (session/local storage)
  // Works for both guests and logged-in users (api.create handles both).
  useEffect(() => {
    if (trackingId || bookedRef.current) return;

    // Prefer a draft that Billing might pass along; otherwise load from storage
    const draft =
      state?.draft ||
      loadDraft(); // you already used saveDraft in Express/Billing

    if (!draft) {
      setLoadingTrack(false);
      setTrackErr("Missing shipment draft. Please re-create your shipment.");
      return;
    }

    (async () => {
      try {
        setLoadingTrack(true);
        setTrackErr("");

        // Create the shipment (guest or user)
        bookedRef.current = true;
        const created = await bookFromDraft(draft, getUserToken());

        // Expect backend response like:
        // { _id, trackingNumber, ... }
        const tid = created?.trackingNumber || created?.tracking || created?.id;
        if (!tid) throw new Error("No tracking number returned by server.");

        setTrackingId(String(tid));
        setShipmentId(String(created?._id || ""));

        // Clear draft so refresh doesn’t rebook
        clearDraft();

        // Also patch history state so a refresh keeps IDs without rebooking
        navigate(".", {
          replace: true,
          state: {
            receipt: {
              ...receipt,
              trackingId: String(tid),
              shipmentId: String(created?._id || ""),
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

  // NEW: pull contacts if Billing included them
  const contacts = receipt.contacts || receipt.contact || {}; // shipperName, shipperEmail, shipperPhone, recipientName, recipientPhone, recipientEmail, recipientAddress

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
              <Link to="/track" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm">Track</Link>
              <Link to="/dashboard" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm">Dashboard</Link>
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
                  value={
                    loadingTrack
                      ? "Creating shipment…"
                      : trackErr
                      ? "—"
                      : trackingId || "Not available"
                  }
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
                <div><dt className="text-gray-500">From</dt><dd className="font-medium">{quote.from}</dd></div>
                <div><dt className="text-gray-500">To</dt><dd className="font-medium">{quote.to}</dd></div>
                <div><dt className="text-gray-500">Service</dt><dd className="font-medium">{quote.service}</dd></div>
                <div><dt className="text-gray-500">Weight</dt><dd className="font-medium">{quote.weightKg} kg</dd></div>
                <div className="col-span-2">
                  <dt className="text-gray-500">Tracking ID</dt>
                  <dd className="font-medium">{trackingId || (loadingTrack ? "Creating…" : "—")}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border p-4">
              <h3 className="font-semibold">Payment</h3>
              <div className="mt-2 text-sm">
                <div className="flex justify-between"><span>Method</span><span className="font-medium">{prettyMethod(method)}</span></div>
                {maskedCard && <div className="flex justify-between"><span>Card</span><span className="font-medium">{maskedCard}</span></div>}
                <div className="flex justify-between"><span>Status</span><span className="font-medium text-emerald-600">Succeeded</span></div>
              </div>
              <div className="mt-3">
                <button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-black text-white text-sm">Print / Save PDF</button>
              </div>
            </section>
          </div>

          {/* NEW: Contacts (shipper & recipient) */}
          <section className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Shipper</h3>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li><b>{contacts.shipperName || "(name not provided)"}</b></li>
                {contacts.shipperEmail && <li>Email: {contacts.shipperEmail}</li>}
                {contacts.shipperPhone && <li>Phone: {contacts.shipperPhone}</li>}
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold">Recipient</h3>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li><b>{contacts.recipientName || "(name not provided)"}</b></li>
                {contacts.recipientPhone && <li>Phone: {contacts.recipientPhone}</li>}
                {contacts.recipientEmail && <li>Email: {contacts.recipientEmail}</li>}
                {contacts.recipientAddress && <li className="text-gray-600">{contacts.recipientAddress}</li>}
              </ul>
            </div>
          </section>

          {/* Charges */}
          <section className="mt-6 rounded-xl border p-4">
            <h3 className="font-semibold">Charges</h3>
            <ul className="mt-2 text-sm space-y-1">
              <li className="flex justify-between"><span>Base</span><span>{money(quote.currency, quote.baseUSD)}</span></li>
              <li className="flex justify-between"><span>Fuel</span><span>{money(totals.currency, totals.fuel)}</span></li>
              <li className="flex justify-between"><span>Security & handling</span><span>{money(totals.currency, totals.security)}</span></li>
              <li className="flex justify-between"><span>Insurance</span><span>{money(totals.currency, totals.insurance)}</span></li>
              <li className="flex justify-between text-gray-500"><span>Taxes / duties</span><span>{money(totals.currency, totals.tax)}</span></li>
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
            <Link to="/services/express" className="px-4 py-2 rounded-xl border">Create another</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function fmt(n){ return Number(n).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
function money(curr, n){
  const sym = curr === "BEL" ? "€" : curr === "EUR" ? "€" : (curr ? `${curr} ` : "$");
  return `${sym}${fmt(n)}`;
}
function prettyMethod(m){
  switch(m){
    case "card": return "Card";
    case "paypal": return "PayPal";
    case "bank": return "Bank transfer";
    case "cod": return "Pay on delivery";
    default: return m || "—";
  }
}
function shorten(id){ return String(id).slice(0,6) + "…" + String(id).slice(-4); }
