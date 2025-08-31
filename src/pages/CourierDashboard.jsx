// src/pages/account/CourierDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/globaledge.png";
import { useAuth } from "../auth/AuthContext";
import { shipments as ShipAPI, apiGet, adminMock as AdminMock } from "../utils/api";

/* =========================================================================
   FRONTEND-ONLY SEED MODE
   - If the current user's id (or ?userId= override) exists in SEED_DASHBOARDS,
     we fill the dashboard from this constant and SKIP all network calls.
   - Edit this object to change what appears.
   ========================================================================= */
const SEED_DASHBOARDS = {
  // 👉 your requested id
  "68b36b2fc5fab02a3724c595": {
    shipments: [
      {
        createdAt: "2025-08-28T08:05:00.000Z",
        trackingNumber: "GE-1001",
        service: "Express",
        serviceType: "parcel",
        status: "In Transit",
        from: "Antwerp, BE",
        to: "London, GB",
        toName: "ops",
        pieces: 1,
        weightKg: 12.4,
        price: 320,
        currency: "EUR",
      },
      {
        createdAt: "2025-08-26T15:12:00.000Z",
        trackingNumber: "GE-1002",
        service: "Standard",
        serviceType: "parcel",
        status: "Delivered",
        from: "Ghent, BE",
        to: "London, GB",
        toName: "receiving",
        pieces: 1,
        weightKg: 7.1,
        price: 280,
        currency: "EUR",
      },
      {
        createdAt: "2025-08-22T10:45:00.000Z",
        trackingNumber: "GE-1003",
        service: "Priority",
        serviceType: "parcel",
        status: "Exception",
        from: "Brussels, BE",
        to: "Paris, FR",
        toName: "ops-fr",
        pieces: 1,
        weightKg: 3.5,
        price: 160,
        currency: "EUR",
      },
    ],
    paymentMethods: [
      { label: "Corporate Visa", brand: "visa", last4: "4242", expMonth: 12, expYear: 2027, default: true },
      { label: "Ops Mastercard", brand: "mastercard", last4: "5454", expMonth: 6, expYear: 2026, default: false },
    ],
    pickups: [
      {
        publicId: "PKP-1001",
        date: "2025-09-01",
        window: "09:00–12:00",
        addressText: "EU Hub — Antwerp",
        status: "Scheduled",
        recurring: false,
      },
    ],
    addresses: [
      { label: "HQ", name: "GlobalEdge", line1: "22 Bishopsgate", city: "London", country: "GB" },
      { label: "EU Hub", name: "Warehouse", line1: "Noorderlaan 100", city: "Antwerp", country: "BE" },
    ],
    billing: {
      currency: "EUR",
      totalSpend: 760,
      deliveredCount: 1,
      inTransitCount: 1,
      exceptionCount: 1,
      byMonth: [{ ym: "2025-03", sum: 0 }, { ym: "2025-04", sum: 0 }, { ym: "2025-05", sum: 0 }, { ym: "2025-06", sum: 0 }, { ym: "2025-07", sum: 0 }, { ym: "2025-08", sum: 760 }],
    },
  },

  // add more seeded users if you want:
  // "68b399b8fc0f0c3b8eaa7f02": { ...another seed... },
};

export default function CourierDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  // ---------- Admin "View as" override via query string ----------
  const search = new URLSearchParams(location.search);
  const overrideUserId = search.get("userId");
  const isAdminView = search.get("mode") === "admin";

  // ---------- Tabs (reduced) ----------
  const TABS = ["Shipments", "Billing", "Pickups"];
  const [tab, setTab] = useState("Shipments");

  // ---------- Data (API/Seed) ----------
  const [shipments, setShipments] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [detailsBilling, setDetailsBilling] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ---------- Load (SEED-FIRST, then optional real data) ----------
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr("");

      const subjectId = overrideUserId || user?._id || user?.id || user?.userId;
      const seed = subjectId && SEED_DASHBOARDS[String(subjectId)];
      console.log("[dashboard] subjectId:", subjectId, "seed?", !!seed);

      // ✅ If this user is seeded, fill from seed and SKIP network.
      if (seed && mounted) {
        const {
          shipments: dShip = [],
          addresses: dAddr = [],
          paymentMethods: dPay = [],
          pickups: dPick = [],
          billing: dBilling = null,
        } = seed;

        setShipments(mapDetailsShipmentsForUI(dShip));
        setAddresses(dAddr);
        setPayments(mapDetailsPaymentsForUI(dPay));
        setPickups(mapDetailsPickupsForUI(dPick));
        if (dBilling) setDetailsBilling(dBilling);

        setLoading(false);
        return; // 🚫 no API calls
      }

      // Not seeded → old behavior (safe/optional)
      try {
        const details = await apiGet("/users/me/details");
        if (details && mounted) {
          const {
            shipments: dShip = [],
            addresses: dAddr = [],
            paymentMethods: dPay = [],
            pickups: dPick = [],
            billing: dBilling = null,
          } = details || {};

          if (Array.isArray(dShip) && dShip.length) {
            setShipments((prev) => [...mapDetailsShipmentsForUI(dShip), ...prev]);
          }
          if (Array.isArray(dAddr) && dAddr.length) setAddresses((prev) => [...dAddr, ...prev]);
          if (Array.isArray(dPay) && dPay.length) setPayments((prev) => [...mapDetailsPaymentsForUI(dPay), ...prev]);
          if (Array.isArray(dPick) && dPick.length) setPickups((prev) => [...mapDetailsPickupsForUI(dPick), ...prev]);
          if (dBilling && typeof dBilling === "object") setDetailsBilling(dBilling);
        }
      } catch (e) {
        if (e?.status !== 404) console.warn("[dashboard] /users/me/details failed:", e);
      }

      let baseShipments = [];
      try {
        const list = await ShipAPI.listMine();
        baseShipments = Array.isArray(list) ? list : [];
      } catch (e) {
        console.warn("[dashboard] ShipAPI.listMine() failed:", e);
        if (mounted) setErr(e?.data?.message || e?.message || "Failed to load shipments");
      } finally {
        if (mounted && baseShipments.length) {
          setShipments((prev) => [...prev, ...baseShipments.map(mapShipmentForUI)]);
        }
      }

      await Promise.all([
        safeLoad("/users/me/addresses", (v) => mounted && v?.length && setAddresses((prev) => [...prev, ...v])),
        safeLoad("/users/me/payments", (v) => mounted && v?.length && setPayments((prev) => [...prev, ...v])),
        safeLoad("/users/me/pickups", (v) => mounted && v?.length && setPickups((prev) => [...prev, ...v])),
      ]);

      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [overrideUserId, user?._id, user?.id, user?.userId]);

  // ---------- Filters (Shipments) ----------
  const [q, setQ] = useState("");
  const [fService, setFService] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (fService !== "all" && s.service !== fService) return false;
      if (fStatus !== "all" && s.status !== fStatus) return false;
      if (q) {
        const t = q.toLowerCase();
        const blob = `${s.tracking} ${s.to} ${s.toName} ${s.from} ${s.service}`.toLowerCase();
        if (!blob.includes(t)) return false;
      }
      if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [shipments, fService, fStatus, q, dateFrom, dateTo]);

  // ---------- Billing Aggregations ----------
  const billingSummary = useMemo(() => {
    if (detailsBilling && typeof detailsBilling === "object") {
      return {
        total: Number(detailsBilling.totalSpend || 0),
        delivered: Number(detailsBilling.deliveredCount || 0),
        inTransit: Number(detailsBilling.inTransitCount || 0),
        exception: Number(detailsBilling.exceptionCount || 0),
        byMonth: Array.isArray(detailsBilling.byMonth) ? detailsBilling.byMonth : [],
      };
    }
    const total = shipments.reduce((acc, s) => acc + (Number(s.cost) || 0), 0);
    const delivered = shipments.filter((s) => s.status === "Delivered").length;
    const inTransit = shipments.filter((s) => s.status === "In Transit").length;
    const exception = shipments.filter((s) => s.status === "Exception").length;

    const byMonth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const sum = shipments
        .filter((s) => (s.date || "").slice(0, 7) === ym)
        .reduce((a, s) => a + (Number(s.cost) || 0), 0);
      return { ym, sum };
    });
    return { total, delivered, inTransit, exception, byMonth };
  }, [shipments, detailsBilling]);

  // ---------- Actions ----------
  function reprint(shipment) {
    toast(`Reprinting label for ${shipment.tracking}…`);
  }
  function duplicate(shipment) {
    toast(`Duplicating shipment ${shipment.tracking} to new draft…`);
    navigate(`/services/express?type=parcel#quote`);
  }
  function exportCSV() {
    const headers = [
      "Date", "Tracking", "Service", "Status", "From", "To", "Recipient", "Pieces", "Weight(kg)", "Cost(EUR)",
    ];
    const rows = filteredShipments.map((s) => [
      s.date, s.tracking, s.service, s.status, s.from, s.to, s.toName || "", s.pieces, s.weight, round2(s.cost),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Pickup Modal (UI-only create for now) ----------
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupForm, setPickupForm] = useState({
    date: "", window: "13:00–17:00", addressId: "", instructions: "",
    recurring: false, frequency: "WEEKLY",
  });

  function submitPickup(e) {
    e.preventDefault();
    if (!pickupForm.date || !pickupForm.addressId) {
      toast("Select a date and address for pickup.");
      return;
    }
    const addr = addresses.find((a) => a.id === pickupForm.addressId || a._id === pickupForm.addressId);
    setPickups((p) => [
      ...p,
      {
        id: "PU" + Math.random().toString(36).slice(2, 7).toUpperCase(),
        ...pickupForm,
        address: addr ? `${addr.name || addr.label || "Address"} — ${addr.line1 || ""}, ${addr.city || ""}` : "",
        createdAt: new Date().toISOString(),
      },
    ]);
    setPickupOpen(false);
    toast("Pickup request created.");
  }

  // ---------- UI ----------
  const displayName =
    (user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")).trim() ||
    (user?.email ? user.email.split("@")[0] : "Customer");
  const displayEmail = user?.email || "you@company.com";

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_120%_-10%,#fef2f2,transparent)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </a>
            <div className="flex items-center gap-3">
              <Link
                to="/services/express?type=parcel#quote"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98]"
              >
                <LightningIcon /> Create Shipment
              </Link>

              {/* Logout */}
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
              >
                Logout
              </button>

              <ProfilePill name={displayName} email={displayEmail} />
              {isAdminView && overrideUserId && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  viewing as {overrideUserId.slice(0, 6)}…
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Subnav */}
      <nav className="bg-white/70 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-2 py-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === t ? "bg-red-600 text-white" : "hover:bg-gray-50"}`}
              >
                {t}
              </button>
            ))}
            <div className="ml-auto flex items-center text-xs text-gray-500">
              {loading ? "Loading…" : err ? <span className="text-red-600">{err}</span> : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Shipments */}
        {tab === "Shipments" && (
          <section>
            <SectionHeader
              title="Shipment Dashboard"
              action={
                <div className="flex gap-2">
                  <button onClick={exportCSV} className="btn-secondary">Export CSV</button>
                  <Link to="/services/express?type=parcel#quote" className="btn-primary">New Shipment</Link>
                </div>
              }
            />
            <div className="grid md:grid-cols-4 gap-3">
              <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tracking, recipient, destination…" />
              <Select
                label="Service"
                value={fService}
                onChange={(e) => setFService(e.target.value)}
                options={[
                  { v: "all", t: "All services" },
                  { v: "Standard", t: "Standard" },
                  { v: "Express", t: "Express" },
                  { v: "Priority", t: "Priority" },
                  { v: "Freight", t: "Freight" },
                ]}
              />
              <Select
                label="Status"
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value)}
                options={[
                  { v: "all", t: "All statuses" },
                  { v: "Created", t: "Created" },
                  { v: "In Transit", t: "In Transit" },
                  { v: "Delivered", t: "Delivered" },
                  { v: "Exception", t: "Exception" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <Th>Date</Th><Th>Tracking</Th><Th>Service</Th><Th>Status</Th><Th>To</Th>
                    <Th>Pieces</Th><Th>Weight</Th><Th>Cost</Th><Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredShipments.map((s) => (
                    <Tr key={s.tracking}>
                      <Td>{formatDate(s.date)}</Td>
                      <Td>
                        <div className="font-medium">{s.tracking}</div>
                        <div className="text-xs text-gray-500">{s.from} → {s.to}</div>
                      </Td>
                      <Td><Tag color="red">{s.service}</Tag></Td>
                      <Td><StatusBadge status={s.status} /></Td>
                      <Td>
                        <div className="font-medium">{s.toName || "-"}</div>
                        <div className="text-xs text-gray-500">{s.to}</div>
                      </Td>
                      <Td>{s.pieces}</Td>
                      <Td>{s.weight} kg</Td>
                      <Td>€{formatMoney(s.cost)}</Td>
                      <Td>
                        <div className="flex gap-2">
                          <button onClick={() => reprint(s)} className="btn-ghost"><PrinterIcon /> Reprint</button>
                          <button onClick={() => duplicate(s)} className="btn-ghost"><CopyIcon /> Duplicate</button>
                          <a href={`https://track.aftership.com/${s.tracking}`} target="_blank" rel="noreferrer" className="btn-ghost">
                            <LinkIcon /> Track
                          </a>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                  {!loading && filteredShipments.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No shipments match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Billing */}
        {tab === "Billing" && (
          <section>
            <SectionHeader title="Cost & Billing" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total spend" value={`€${formatMoney(billingSummary.total)}`} note="All time" />
              <KpiCard label="Delivered" value={billingSummary.delivered} note="Shipments" />
              <KpiCard label="In transit" value={billingSummary.inTransit} note="Shipments" />
              <KpiCard label="Exceptions" value={billingSummary.exception} note="Shipments" />
            </div>

            <div className="mt-6 rounded-2xl border bg-white p-5">
              <h3 className="font-semibold">Last 6 months spend</h3>
              <MiniBarChart
                series={billingSummary.byMonth.map((m) => m.sum)}
                labels={billingSummary.byMonth.map((m) => m.ym)}
              />
              <div className="mt-3 text-xs text-gray-500">
                {detailsBilling ? "Server-calculated" : "Estimate"} based on posted shipments. Final charges appear in your monthly statement.
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border bg-white p-5">
                <h3 className="font-semibold mb-3">Payment methods</h3>
                <ul className="space-y-3">
                  {payments.map((p) => (
                    <li key={p.id || p._id || p.externalId || `${p.brand}-${p.last4}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardIcon />
                        <div>
                          <div className="font-medium">
                            {p.brand || p.label || "Card"} {p.last4 ? `• • • • ${p.last4}` : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.exp ? `Exp ${p.exp}` : expPartsToStr(p.expMonth, p.expYear)}
                          </div>
                        </div>
                      </div>
                      {p.default && <Tag color="slate">Default</Tag>}
                    </li>
                  ))}
                  {payments.length === 0 && <li className="text-sm text-gray-500">No payment methods yet.</li>}
                </ul>
                <div className="mt-4">
                  <button className="btn-secondary w-full">Add payment method</button>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 lg:col-span-2">
                <h3 className="font-semibold mb-3">Statements</h3>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr><Th>Month</Th><Th>Amount</Th><Th>Status</Th><Th>Invoice</Th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {billingSummary.byMonth.map((m) => (
                        <Tr key={m.ym}>
                          <Td>{m.ym}</Td>
                          <Td>€{formatMoney(m.sum)}</Td>
                          <Td><StatusBadge status="Posted" /></Td>
                          <Td><button className="btn-ghost"><DownloadIcon /> PDF</button></Td>
                        </Tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pickups */}
        {tab === "Pickups" && (
          <section>
            <SectionHeader
              title="Pickup & Delivery Management"
              action={<button className="btn-primary" onClick={() => setPickupOpen(true)}>Request Pickup</button>}
            />
            <div className="rounded-2xl border bg-white overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr><Th>ID</Th><Th>Date</Th><Th>Window</Th><Th>Address</Th><Th>Recurring</Th><Th>Status</Th></tr>
                </thead>
                <tbody className="divide-y">
                  {pickups.length > 0 ? (
                    pickups.map((p) => (
                      <Tr key={p.id || p._id || p.publicId}>
                        <Td>{p.id || p._id || p.publicId}</Td>
                        <Td>{p.date}</Td>
                        <Td>{p.window}</Td>
                        <Td>{p.address || p.addressText}</Td>
                        <Td>{p.recurring ? `${p.frequency}` : "No"}</Td>
                        <Td><StatusBadge status={p.status || "Requested"} /></Td>
                      </Tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No pickups yet. Click “Request Pickup” to get started.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal */}
            {pickupOpen && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setPickupOpen(false)}>
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Request a pickup</h3>
                    <button onClick={() => setPickupOpen(false)} className="btn-ghost">Close</button>
                  </div>
                  <form className="mt-4 grid gap-3" onSubmit={submitPickup}>
                    <Input label="Date" type="date" value={pickupForm.date}
                      onChange={(e) => setPickupForm({ ...pickupForm, date: e.target.value })} />
                    <Select
                      label="Time window"
                      value={pickupForm.window}
                      onChange={(e) => setPickupForm({ ...pickupForm, window: e.target.value })}
                      options={[
                        { v: "09:00–13:00", t: "09:00–13:00" },
                        { v: "13:00–17:00", t: "13:00–17:00" },
                        { v: "17:00–20:00", t: "17:00–20:00" },
                      ]}
                    />
                    <Select
                      label="Pickup address"
                      value={pickupForm.addressId}
                      onChange={(e) => setPickupForm({ ...pickupForm, addressId: e.target.value })}
                      options={[
                        { v: "", t: "Select address…" },
                        ...addresses.map((a) => ({
                          v: a.id || a._id, t: `${a.name || a.label || "Address"} — ${a.city || ""}`,
                        })),
                      ]}
                    />
                    <Textarea
                      label="Instructions (optional)"
                      value={pickupForm.instructions}
                      onChange={(e) => setPickupForm({ ...pickupForm, instructions: e.target.value })}
                      placeholder="Gate code, loading dock, contact name/number…"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="recurring" type="checkbox" checked={pickupForm.recurring}
                        onChange={(e) => setPickupForm({ ...pickupForm, recurring: e.target.checked })}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor="recurring" className="text-sm">Recurring pickup</label>
                      {pickupForm.recurring && (
                        <select
                          value={pickupForm.frequency}
                          onChange={(e) => setPickupForm({ ...pickupForm, frequency: e.target.value })}
                          className="ml-auto rounded-lg border px-3 py-2 text-sm"
                        >
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="BIWEEKLY">Biweekly</option>
                        </select>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setPickupOpen(false)} className="btn-ghost">Cancel</button>
                      <button type="submit" className="btn-primary">Submit request</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

/* ======================= Helpers (API mapping + utils) ======================= */

// Fallback GET helpers for legacy endpoints
async function safeLoad(path, setter) {
  try {
    const data = await apiGet(path);
    setter(Array.isArray(data) ? data : []);
  } catch (e) {
    // ignore
  }
}

// Map backend Shipment -> UI row expected by this screen (legacy shipments API)
function mapShipmentForUI(s) {
  const service =
    s.serviceType === "freight"
      ? "Freight"
      : (s.parcel?.level || "standard").replace(/^\w/, (c) => c.toUpperCase());
  const status = toTitleStatus(s.status);
  const pieces = s.serviceType === "freight" ? s.freight?.pallets || 1 : 1;
  const weight = s.serviceType === "freight" ? s.freight?.weight || 0 : s.parcel?.weight || 0;

  return {
    date: s.createdAt,
    tracking: s.trackingNumber,
    service,
    status,
    from: s.from || "—",
    to: s.to || "—",
    toName: s.recipientEmail ? s.recipientEmail.split("@")[0] : "",
    pieces,
    weight,
    cost: Number(s.price || 0),
  };
}

// Map admin-edited (or seeded) UserDetails → UI
function mapDetailsShipmentsForUI(arr) {
  return (arr || []).map((s) => ({
    date: s.createdAt,
    tracking: s.trackingNumber,
    service: s.service || (s.serviceType === "freight" ? "Freight" : "Standard"),
    status: s.status || "Created",
    from: s.from || "—",
    to: s.to || "—",
    toName: s.toName || "",
    pieces: Number(s.pieces ?? (s.serviceType === "freight" ? 1 : 1)),
    weight: Number(s.weightKg || 0),
    cost: Number(s.price || 0),
  }));
}
function mapDetailsPaymentsForUI(arr) {
  return (arr || []).map((p) => ({
    label: p.label || p.brand || "Card",
    brand: p.brand || "",
    last4: (String(p.last4 || "").match(/\d{4}$/)?.[0]) || "",
    expMonth: p.expMonth,
    expYear: p.expYear,
    exp: expPartsToStr(p.expMonth, p.expYear),
    default: !!p.default,
    provider: p.provider || "mock",
    externalId: p.externalId || p.id || p._id,
    status: p.status || "valid",
  }));
}
function mapDetailsPickupsForUI(arr) {
  return (arr || []).map((p) => ({
    id: p.publicId || p._id || p.id,
    date: p.date ? new Date(p.date).toISOString().slice(0, 10) : "",
    window: p.window || "13:00–17:00",
    address: p.addressText || "",
    recurring: !!p.recurring,
    frequency: p.frequency || "WEEKLY",
    status: p.status || "Requested",
  }));
}

function expPartsToStr(mm, yy) {
  if (!mm && !yy) return "";
  const m = mm ? String(mm).padStart(2, "0") : "";
  const y = yy ? String(yy).slice(-2) : "";
  return [m, y].filter(Boolean).join("/");
}

function toTitleStatus(code) {
  const map = {
    CREATED: "Created",
    PICKED_UP: "Picked Up",
    IN_TRANSIT: "In Transit",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    EXCEPTION: "Exception",
    CANCELLED: "Cancelled",
  };
  return map[String(code || "").toUpperCase()] || "Created";
}

function toast(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.className =
    "fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black text-white text-sm shadow";
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2600);
}
function csvCell(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
function formatMoney(n) {
  return (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

/* ======================= Reusable UI ======================= */
function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
function KpiCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      {note && <div className="mt-1 text-xs text-gray-500">{note}</div>}
    </div>
  );
}
function Input({ label, ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-gray-600">{label}</span>}
      <input {...rest} className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30" />
    </label>
  );
}
function Textarea({ label, ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-gray-600">{label}</span>}
      <textarea
        {...rest}
        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30 min-h-[90px]"
      />
    </label>
  );
}
function Select({ label, options = [], ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-gray-600">{label}</span>}
      <select {...rest} className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30">
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.t}</option>
        ))}
      </select>
    </label>
  );
}
function Tag({ children, color = "slate" }) {
  const styles = color === "red" ? "bg-red-50 text-red-700 ring-red-200" : "bg-gray-100 text-gray-700 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${styles}`}>
      {children}
    </span>
  );
}
function StatusBadge({ status }) {
  const map = {
    Created: "bg-gray-100 text-gray-700 ring-gray-200",
    "In Transit": "bg-blue-50 text-blue-700 ring-blue-200",
    Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Exception: "bg-red-50 text-red-700 ring-red-200",
    Posted: "bg-purple-50 text-purple-700 ring-purple-200",
    Requested: "bg-amber-50 text-amber-800 ring-amber-200",
    "Picked Up": "bg-sky-50 text-sky-700 ring-sky-200",
    "Out for Delivery": "bg-amber-50 text-amber-800 ring-amber-200",
    Cancelled: "bg-gray-200 text-gray-600 ring-gray-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${map[status] || "bg-gray-100 text-gray-700 ring-gray-200"}`}>
      {status}
    </span>
  );
}
function ProfilePill({ name, email }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border px-2 py-1.5">
      <div className="grid place-items-center w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold">
        {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="hidden sm:block">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-gray-500">{email}</div>
      </div>
    </div>
  );
}
function MiniBarChart({ series = [], labels = [] }) {
  const max = Math.max(1, ...series);
  const h = 120;
  const barW = 28;
  const gap = 16;
  const w = series.length * barW + (series.length - 1) * gap + 24;
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="mt-3 w-full max-w-full">
      {series.map((v, i) => {
        const x = 12 + i * (barW + gap);
        const bh = Math.round((v / max) * h);
        const y = h - bh + 8;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="6" className="fill-red-600 opacity-90"></rect>
            <text x={x + barW / 2} y={h + 20} textAnchor="middle" className="fill-gray-500 text-[10px]">
              {labels[i]?.slice(2) || ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function Th({ children }) { return <th className="text-left px-4 py-3 font-semibold">{children}</th>; }
function Tr({ children }) { return <tr className="odd:bg-white even:bg-gray-50">{children}</tr>; }
function Td({ children }) { return <td className="px-4 py-3 align-top">{children}</td>; }

/* ======================= Icons ======================= */
function LightningIcon() {
  return (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M11 21 3 13h6L7 3h10l-4 8h6z" /></svg>);
}
function PrinterIcon() {
  return (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M7 8V3h10v5" /><rect x="5" y="8" width="14" height="8" rx="2" /><path d="M7 16h10v5H7z" />
  </svg>);
}
function CopyIcon() {
  return (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="9" y="9" width="10" height="10" rx="2" /><rect x="5" y="5" width="10" height="10" rx="2" />
  </svg>);
}
function LinkIcon() {
  return (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83A5 5 0 0 0 11.17 21L13 19" />
  </svg>);
}
function DownloadIcon() {
  return (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><rect x="3" y="19" width="18" height="2" rx="1" />
  </svg>);
}
function CardIcon() {
  return (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
  </svg>);
}
