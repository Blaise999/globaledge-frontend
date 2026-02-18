// src/pages/services/ExpressPage.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { upload } from "@vercel/blob/client";
import Logo from "../../assets/globaledge.png";
import { saveDraft } from "../../utils/storage";

export default function ExpressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // main selectors
  const [serviceType, setServiceType] = useState("parcel"); // parcel | freight
  const [parcelLevel, setParcelLevel] = useState("express"); // standard | express | priority
  const [freightMode, setFreightMode] = useState("air"); // air | sea | road

  // stable key for this booking session (folder for Vercel Blob + draft key)
  const [shipmentKey] = useState(() => {
    const c = globalThis.crypto;
    return c?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  });

  // parcel form
  const [parcel, setParcel] = useState({
    from: "",
    to: "",
    // shipper (sender)
    shipperName: "",
    shipperEmail: "",
    shipperPhone: "",
    // recipient
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    recipientAddress: "",
    // dims
    weight: "",
    length: "",
    width: "",
    height: "",
    value: "",
    contents: "",
  });

  // freight form
  const [freight, setFreight] = useState({
    from: "",
    to: "",
    // shipper (sender)
    shipperName: "",
    shipperEmail: "",
    shipperPhone: "",
    // recipient
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    recipientAddress: "",
    // freight details
    pallets: 1,
    length: "",
    width: "",
    height: "",
    weight: "",
    incoterm: "DAP",
  });

  // ---------------- goods photos (Vercel Blob) ----------------
  const GOODS_MAX = 6;
  const MAX_MB = 8;
  const fileRef = useRef(null);

  const [goodsUploading, setGoodsUploading] = useState(false);
  const [goodsUploadErr, setGoodsUploadErr] = useState("");
  const [goodsPhotos, setGoodsPhotos] = useState([]); // [{ url, pathname, size, contentType, name }]

  function safeName(name = "photo") {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  function removeGoodsPhoto(url) {
    setGoodsPhotos((prev) => prev.filter((p) => p.url !== url));
  }

  async function uploadGoodsPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setGoodsUploadErr("");
    setGoodsUploading(true);

    try {
      const remainingSlots = Math.max(0, GOODS_MAX - goodsPhotos.length);
      const chosen = files.slice(0, remainingSlots);

      if (!chosen.length) {
        throw new Error(`You can upload up to ${GOODS_MAX} photos.`);
      }

      const uploaded = [];
      for (const file of chosen) {
        if (!file.type?.startsWith("image/")) throw new Error("Only image files are allowed.");
        if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Max ${MAX_MB}MB per photo.`);

        const pathname = `shipments/${shipmentKey}/goods/${Date.now()}-${safeName(file.name)}`;

        // NOTE: requires your Vercel Function token endpoint at /api/goods/upload
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/goods/upload",
          clientPayload: shipmentKey,
        });

        uploaded.push({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          contentType: blob.contentType,
          name: file.name,
        });
      }

      setGoodsPhotos((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setGoodsUploadErr(e instanceof Error ? e.message : String(e));
    } finally {
      setGoodsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ---------- deep-linking ----------
  useEffect(() => {
    const type = (searchParams.get("type") || "").toLowerCase(); // parcel | freight
    const mode = (searchParams.get("mode") || "").toLowerCase(); // air | sea | road
    const level = (searchParams.get("level") || "").toLowerCase(); // standard | express | priority

    if (type === "freight" || type === "parcel") setServiceType(type);
    if (mode === "air" || mode === "sea" || mode === "road") setFreightMode(mode);
    if (level === "standard" || level === "express" || level === "priority") setParcelLevel(level);

    if (location.hash === "#quote") {
      setTimeout(() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: select a service/mode/level and jump to the estimator
  function selectAndScroll({ type, level, mode }) {
    if (type === "parcel") {
      setServiceType("parcel");
      if (level) setParcelLevel(level);
    } else if (type === "freight") {
      setServiceType("freight");
      if (mode) setFreightMode(mode);
    }
    const qs = new URLSearchParams();
    qs.set("type", type);
    if (level) qs.set("level", level);
    if (mode) qs.set("mode", mode);
    navigate({ search: `?${qs.toString()}`, hash: "#quote" }, { replace: true });

    setTimeout(() => {
      document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // ---------------- calcs: parcel ----------------
  const volumetricParcel = useMemo(() => {
    const l = +parcel.length || 0,
      w = +parcel.width || 0,
      h = +parcel.height || 0;
    const vol = l && w && h ? (l * w * h) / 5000 : 0;
    return round2(vol);
  }, [parcel.length, parcel.width, parcel.height]);

  const billableParcel = useMemo(() => {
    const actual = +parcel.weight || 0;
    return Math.max(actual, volumetricParcel);
  }, [parcel.weight, volumetricParcel]);

  // ---------------- calcs: freight ----------------
  const volumetricFreight = useMemo(() => {
    const l = +freight.length || 0,
      w = +freight.width || 0,
      h = +freight.height || 0;
    const divisor = freightMode === "air" ? 6000 : 5000;
    const vol = l && w && h ? (l * w * h) / divisor : 0;
    return round2(vol * (+freight.pallets || 1));
  }, [freight.length, freight.width, freight.height, freightMode, freight.pallets]);

  const billableFreight = useMemo(() => {
    const actual = (+freight.weight || 0) * (+freight.pallets || 1);
    return Math.max(actual, volumetricFreight);
  }, [freight.weight, freight.pallets, volumetricFreight]);

  // ---------------- quotes ----------------
  const parcelQuote = useMemo(() => {
    if (!parcel.from || !parcel.to || !billableParcel) return null;
    const sameCountry = tailCountry(parcel.from) === tailCountry(parcel.to);
    const base = sameCountry ? 8 : 18;
    const perKg = sameCountry ? 2.8 : 5.2;
    const speedMult = parcelLevel === "standard" ? 1 : parcelLevel === "express" ? 1.25 : 1.55;
    const fuel = 0.12,
      security = 3.0;
    let subtotal = (base + billableParcel * perKg) * speedMult;
    const sur = subtotal * fuel + security;
    const total = Math.max(9, subtotal + sur);
    return {
      currency: "EUR",
      total: round2(total),
      eta:
        parcelLevel === "standard"
          ? "2–5 business days"
          : parcelLevel === "express"
          ? "24–72 hours"
          : "12–48 hours",
      billable: billableParcel,
      recipientEmail: parcel.recipientEmail || "",
      recipientAddress: parcel.recipientAddress || "",
    };
  }, [
    parcel.from,
    parcel.to,
    billableParcel,
    parcelLevel,
    parcel.recipientEmail,
    parcel.recipientAddress,
  ]);

  const freightQuote = useMemo(() => {
    if (!freight.from || !freight.to || !billableFreight) return null;
    const modeBase = freightMode === "air" ? 150 : freightMode === "sea" ? 90 : 120;
    const perKg = freightMode === "air" ? 2.2 : freightMode === "sea" ? 1.0 : 1.4;
    const sameCountry = tailCountry(freight.from) === tailCountry(freight.to);
    const domesticDiscount = sameCountry ? 0.85 : 1;
    const fuel = freightMode === "air" ? 0.18 : 0.08;
    const security = freightMode === "air" ? 12 : 6;
    let subtotal = (modeBase + billableFreight * perKg) * domesticDiscount;
    const sur = subtotal * fuel + security;
    const total = Math.max(25, subtotal + sur);
    const eta =
      freightMode === "air"
        ? "2–7 days door-to-door"
        : freightMode === "sea"
        ? "12–35 days port-to-door"
        : "2–10 days door-to-door";
    return {
      currency: "EUR",
      total: round2(total),
      eta,
      billable: billableFreight,
      recipientEmail: freight.recipientEmail || "",
      recipientAddress: freight.recipientAddress || "",
    };
  }, [
    freight.from,
    freight.to,
    billableFreight,
    freightMode,
    freight.recipientEmail,
    freight.recipientAddress,
  ]);

  const quote = serviceType === "parcel" ? parcelQuote : freightQuote;

  // email + address validation + gating CTA
  const currentEmail = serviceType === "parcel" ? parcel.recipientEmail : freight.recipientEmail;
  const currentAddress = serviceType === "parcel" ? parcel.recipientAddress : freight.recipientAddress;
  const emailOk = isEmail(currentEmail);
  const addressOk = (currentAddress || "").trim().length > 5;

  // ---------- build draft & navigate ----------
  function makeDraft({ serviceType, parcelLevel, freightMode, parcel, freight, from, to }) {
    if (serviceType === "freight") {
      return {
        serviceType: "freight",
        from,
        to,
        recipientEmail: freight.recipientEmail || "",
        recipientAddress: freight.recipientAddress || "",
        contact: {
          shipperName: freight.shipperName || "",
          shipperEmail: freight.shipperEmail || "",
          shipperPhone: freight.shipperPhone || "",
          recipientName: freight.recipientName || "",
          recipientPhone: freight.recipientPhone || "",
        },
        freight: {
          mode: freightMode,
          pallets: Number(freight.pallets || 1),
          length: Number(freight.length || 0),
          width: Number(freight.width || 0),
          height: Number(freight.height || 0),
          weight: Number(freight.weight || 0),
          incoterm: freight.incoterm || "DAP",
        },
      };
    }
    return {
      serviceType: "parcel",
      from,
      to,
      recipientEmail: parcel.recipientEmail || "",
      recipientAddress: parcel.recipientAddress || "",
      contact: {
        shipperName: parcel.shipperName || "",
        shipperEmail: parcel.shipperEmail || "",
        shipperPhone: parcel.shipperPhone || "",
        recipientName: parcel.recipientName || "",
        recipientPhone: parcel.recipientPhone || "",
      },
      parcel: {
        weight: Number(parcel.weight || 0),
        length: Number(parcel.length || 0),
        width: Number(parcel.width || 0),
        height: Number(parcel.height || 0),
        value: Number(parcel.value || 0),
        contents: parcel.contents || "",
        level: parcelLevel, // standard | express | priority
      },
    };
  }

  function onContinueToBilling() {
    if (!emailOk || !addressOk || !quote) return;
    if (goodsUploading) return;

    const draft = makeDraft({
      serviceType,
      parcelLevel,
      freightMode,
      parcel,
      freight,
      from: serviceType === "parcel" ? parcel.from : freight.from,
      to: serviceType === "parcel" ? parcel.to : freight.to,
    });

    // attach quote snapshot for summary
    draft.price = quote.total;
    draft.currency = quote.currency;
    draft.eta = quote.eta;
    draft.billable = quote.billable;

    // attach goods photos (Blob URLs) so Tracking can show them later
    draft.shipmentKey = shipmentKey;
    draft.goodsPhotos = goodsPhotos; // [{url, pathname, size, contentType, name}]

    saveDraft(draft);
    navigate("/Billing", { state: { fromEstimator: true } });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
              <span className="hidden sm:inline text-sm font-semibold text-gray-800">GlobalEdge</span>
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

      {/* Hero + estimator */}
      <section className="relative bg-gradient-to-br from-red-600 to-red-700 text-white overflow-hidden">
        {/* subtle glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="pt-2">
              <p className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/15 ring-1 ring-white/25">
                <LightningIcon /> Book a shipment
              </p>

              <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">
                Create Shipment — parcel or freight.
              </h1>

              <p className="mt-4 text-white/90 max-w-prose">
                Door-to-door parcels within <b>24–72 hours</b> or full freight moves by air, sea, or road.
                Real-time tracking, customs support, and clear pricing.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#quote" className="px-4 py-2 rounded-xl bg-white text-gray-900 font-semibold active:scale-[0.98]">
                  Start a quote
                </a>
                <Link
                  to="/#support"
                  className="px-4 py-2 rounded-xl ring-1 ring-inset ring-white/60 font-semibold active:scale-[0.98]"
                >
                  Talk to support
                </Link>
              </div>

              <dl className="mt-8 grid grid-cols-3 gap-4 text-sm text-white/90">
                <Stat label="Live tracking" value="Every scan" />
                <Stat label="Coverage" value="220+ destinations" />
                <Stat label="On-time SLA" value="98.7%" />
              </dl>
            </div>

            <div
              id="quote"
              className="rounded-3xl overflow-hidden bg-white text-gray-900 ring-1 ring-inset ring-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            >
              <div className="p-6 border-b bg-gradient-to-b from-white to-gray-50">
                <h2 className="text-xl font-semibold">Instant quote</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Get a quick estimate, add goods photos, then continue to booking.
                </p>
              </div>

              <div className="p-6 grid gap-4">
                {/* high-level choice */}
                <div className="grid grid-cols-2 gap-2">
                  <TogglePill label="Parcel" active={serviceType === "parcel"} onClick={() => setServiceType("parcel")} />
                  <TogglePill label="Freight" active={serviceType === "freight"} onClick={() => setServiceType("freight")} />
                </div>

                {/* parcel sublevels */}
                {serviceType === "parcel" && (
                  <div className="grid sm:grid-cols-3 gap-2">
                    <TogglePill label="Standard" active={parcelLevel === "standard"} onClick={() => setParcelLevel("standard")} />
                    <TogglePill label="Express" active={parcelLevel === "express"} onClick={() => setParcelLevel("express")} />
                    <TogglePill label="Priority" active={parcelLevel === "priority"} onClick={() => setParcelLevel("priority")} />
                  </div>
                )}

                {/* freight submodes */}
                {serviceType === "freight" && (
                  <div className="grid sm:grid-cols-3 gap-2">
                    <TogglePill label="Air" active={freightMode === "air"} onClick={() => setFreightMode("air")} />
                    <TogglePill label="Sea" active={freightMode === "sea"} onClick={() => setFreightMode("sea")} />
                    <TogglePill label="Road" active={freightMode === "road"} onClick={() => setFreightMode("road")} />
                  </div>
                )}

                <DividerLabel text="Route & contacts" />

                {/* addresses + contacts */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {serviceType === "parcel" ? (
                    <>
                      {/* Route */}
                      <LabeledInput
                        label="From (City, Country)"
                        value={parcel.from}
                        onChange={(e) => setParcel((s) => ({ ...s, from: e.target.value }))}
                        placeholder="Brussels, Belgium"
                      />
                      <LabeledInput
                        label="To (City, Country)"
                        value={parcel.to}
                        onChange={(e) => setParcel((s) => ({ ...s, to: e.target.value }))}
                        placeholder="London, United Kingdom"
                      />

                      {/* Shipper contact */}
                      <div className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Shipper (Sender)
                      </div>
                      <LabeledInput
                        label="Shipper name"
                        value={parcel.shipperName}
                        onChange={(e) => setParcel((s) => ({ ...s, shipperName: e.target.value }))}
                        placeholder="Your full name / company"
                      />
                      <LabeledInput
                        label="Shipper email"
                        type="email"
                        value={parcel.shipperEmail}
                        onChange={(e) => setParcel((s) => ({ ...s, shipperEmail: e.target.value }))}
                        placeholder="you@example.com"
                      />
                      <LabeledInput
                        label="Shipper phone"
                        type="tel"
                        value={parcel.shipperPhone}
                        onChange={(e) => setParcel((s) => ({ ...s, shipperPhone: e.target.value }))}
                        placeholder="+234 801 234 5678"
                        className="sm:col-span-2"
                      />

                      {/* Recipient contact */}
                      <div className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Recipient
                      </div>
                      <LabeledInput
                        label="Recipient name"
                        value={parcel.recipientName}
                        onChange={(e) => setParcel((s) => ({ ...s, recipientName: e.target.value }))}
                        placeholder="Consignee name"
                      />
                      <LabeledInput
                        label="Recipient phone"
                        type="tel"
                        value={parcel.recipientPhone}
                        onChange={(e) => setParcel((s) => ({ ...s, recipientPhone: e.target.value }))}
                        placeholder="+44 20 1234 5678"
                      />
                      <LabeledInput
                        label="Recipient email"
                        type="email"
                        value={parcel.recipientEmail}
                        onChange={(e) => setParcel((s) => ({ ...s, recipientEmail: e.target.value }))}
                        placeholder="receiver@example.com"
                        className="sm:col-span-2"
                      />
                      <LabeledInput
                        label="Recipient address"
                        type="text"
                        value={parcel.recipientAddress}
                        onChange={(e) => setParcel((s) => ({ ...s, recipientAddress: e.target.value }))}
                        placeholder="123 Example Street, London"
                        className="sm:col-span-2"
                      />
                    </>
                  ) : (
                    <>
                      {/* Route */}
                      <LabeledInput
                        label="From (City, Country)"
                        value={freight.from}
                        onChange={(e) => setFreight((s) => ({ ...s, from: e.target.value }))}
                        placeholder="Lagos, Nigeria"
                      />
                      <LabeledInput
                        label="To (City, Country)"
                        value={freight.to}
                        onChange={(e) => setFreight((s) => ({ ...s, to: e.target.value }))}
                        placeholder="Rotterdam, Netherlands"
                      />

                      {/* Shipper contact */}
                      <div className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Shipper (Sender)
                      </div>
                      <LabeledInput
                        label="Shipper name"
                        value={freight.shipperName}
                        onChange={(e) => setFreight((s) => ({ ...s, shipperName: e.target.value }))}
                        placeholder="Your full name / company"
                      />
                      <LabeledInput
                        label="Shipper email"
                        type="email"
                        value={freight.shipperEmail}
                        onChange={(e) => setFreight((s) => ({ ...s, shipperEmail: e.target.value }))}
                        placeholder="you@example.com"
                      />
                      <LabeledInput
                        label="Shipper phone"
                        type="tel"
                        value={freight.shipperPhone}
                        onChange={(e) => setFreight((s) => ({ ...s, shipperPhone: e.target.value }))}
                        placeholder="+234 801 234 5678"
                        className="sm:col-span-2"
                      />

                      {/* Recipient contact */}
                      <div className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Recipient
                      </div>
                      <LabeledInput
                        label="Recipient name"
                        value={freight.recipientName}
                        onChange={(e) => setFreight((s) => ({ ...s, recipientName: e.target.value }))}
                        placeholder="Consignee name"
                      />
                      <LabeledInput
                        label="Recipient phone"
                        type="tel"
                        value={freight.recipientPhone}
                        onChange={(e) => setFreight((s) => ({ ...s, recipientPhone: e.target.value }))}
                        placeholder="+31 10 123 4567"
                      />
                      <LabeledInput
                        label="Recipient email"
                        type="email"
                        value={freight.recipientEmail}
                        onChange={(e) => setFreight((s) => ({ ...s, recipientEmail: e.target.value }))}
                        placeholder="consignee@example.com"
                        className="sm:col-span-2"
                      />
                      <LabeledInput
                        label="Recipient address"
                        type="text"
                        value={freight.recipientAddress}
                        onChange={(e) => setFreight((s) => ({ ...s, recipientAddress: e.target.value }))}
                        placeholder="Warehouse 7, 456 Port Road, Rotterdam"
                        className="sm:col-span-2"
                      />
                    </>
                  )}
                </div>

                <DividerLabel text="Goods photos" />

                {/* goods photos (Vercel Blob) */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Add pictures of the goods</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        Optional — helps verification & shows on tracking. Up to <b>{GOODS_MAX}</b> photos.
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        Max {MAX_MB}MB each • JPG/PNG/WEBP
                      </div>
                    </div>

                    <div className="shrink-0">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => uploadGoodsPhotos(e.target.files)}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={goodsUploading || goodsPhotos.length >= GOODS_MAX}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold active:scale-[0.98] ${
                          goodsUploading || goodsPhotos.length >= GOODS_MAX
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-black text-white hover:bg-gray-900"
                        }`}
                      >
                        {goodsUploading ? "Uploading…" : goodsPhotos.length ? "Add more" : "Add photos"}
                      </button>
                    </div>
                  </div>

                  {goodsUploadErr ? <div className="mt-2 text-xs text-red-600">{goodsUploadErr}</div> : null}

                  {goodsPhotos.length ? (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {goodsPhotos.map((p) => (
                        <div key={p.url} className="relative group rounded-lg overflow-hidden border bg-white">
                          <img src={p.url} alt={p.name || "Goods"} className="w-full aspect-square object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                            <div className="text-[10px] text-white/90 truncate">
                              {p.name || "photo"} • {humanSize(p.size || 0)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGoodsPhoto(p.url)}
                            className="absolute top-2 right-2 rounded-md bg-black/70 text-white text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                            title="Remove"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-600">
                      No photos added yet.
                    </div>
                  )}

                  <div className="mt-2 text-[11px] text-gray-500">
                    Note: photos upload instantly to Blob. Removing here only removes it from this booking draft.
                  </div>
                </div>

                <DividerLabel text="Package details" />

                {/* dims/weight switch */}
                {serviceType === "parcel" ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <LabeledInput
                      label="Weight (kg)"
                      value={parcel.weight}
                      onChange={(e) => setParcel((s) => ({ ...s, weight: e.target.value }))}
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="2.5"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <LabeledInput
                        compact
                        label="L (cm)"
                        value={parcel.length}
                        onChange={(e) => setParcel((s) => ({ ...s, length: e.target.value }))}
                        type="number"
                        min="0"
                        step="1"
                      />
                      <LabeledInput
                        compact
                        label="W (cm)"
                        value={parcel.width}
                        onChange={(e) => setParcel((s) => ({ ...s, width: e.target.value }))}
                        type="number"
                        min="0"
                        step="1"
                      />
                      <LabeledInput
                        compact
                        label="H (cm)"
                        value={parcel.height}
                        onChange={(e) => setParcel((s) => ({ ...s, height: e.target.value }))}
                        type="number"
                        min="0"
                        step="1"
                      />
                    </div>

                    <LabeledInput
                      label="Declared value (optional)"
                      value={parcel.value}
                      onChange={(e) => setParcel((s) => ({ ...s, value: e.target.value }))}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="200"
                    />
                    <LabeledInput
                      label="Contents (short description)"
                      value={parcel.contents}
                      onChange={(e) => setParcel((s) => ({ ...s, contents: e.target.value }))}
                      placeholder="Shoes, phone, documents…"
                    />

                    <p className="sm:col-span-2 text-xs text-gray-500">
                      Volumetric: <b>{volumetricParcel || 0} kg</b> • Billable: <b>{billableParcel || 0} kg</b>
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="grid grid-cols-3 gap-3">
                      <LabeledInput
                        compact
                        label="L (cm)"
                        value={freight.length}
                        onChange={(e) => setFreight((s) => ({ ...s, length: e.target.value }))}
                        type="number"
                        min="0"
                        step="1"
                      />
                      <LabeledInput
                        compact
                        label="W (cm)"
                        value={freight.width}
                        onChange={(e) => setFreight((s) => ({ ...s, width: e.target.value }))}
                        type="number"
                        min="0"
                        step="1"
                      />
                      <LabeledInput
                        compact
                        label="H (cm)"
                        value={freight.height}
                        onChange={(e) => setFreight((s) => ({ ...s, height: e.target.value }))}
                        type="number"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <LabeledInput
                        label="Weight (kg / pallet)"
                        value={freight.weight}
                        onChange={(e) => setFreight((s) => ({ ...s, weight: e.target.value }))}
                        type="number"
                        min="0"
                        step="1"
                      />
                      <LabeledInput
                        label="Pallets"
                        value={freight.pallets}
                        onChange={(e) => setFreight((s) => ({ ...s, pallets: e.target.value }))}
                        type="number"
                        min="1"
                        step="1"
                      />
                    </div>
                    <div className="sm:col-span-2 grid sm:grid-cols-3 gap-3">
                      <LabeledInput
                        label="Incoterm"
                        value={freight.incoterm}
                        onChange={(e) => setFreight((s) => ({ ...s, incoterm: e.target.value }))}
                        placeholder="DAP"
                      />
                      <div className="sm:col-span-2 text-xs text-gray-500 self-center">
                        Volumetric (mode-adjusted): <b>{volumetricFreight || 0} kg</b> • Billable est.:{" "}
                        <b>{billableFreight || 0} kg</b>
                      </div>
                    </div>
                  </div>
                )}

                {/* result */}
                <div className="rounded-xl border bg-gray-50 p-4">
                  {quote ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-sm text-gray-600">Est. total</div>
                        <div className="text-2xl font-bold">
                          {quote.currency} {formatMoney(quote.total)}
                        </div>
                        <div className="text-xs text-gray-500">ETA: {quote.eta}</div>

                        {!emailOk && (
                          <div className="mt-1 text-xs text-red-600">Enter a valid recipient email to continue.</div>
                        )}
                        {!addressOk && (
                          <div className="mt-1 text-xs text-red-600">
                            Enter the recipient street address to continue.
                          </div>
                        )}
                        {goodsUploading && (
                          <div className="mt-1 text-xs text-gray-700">Uploading photos… please wait.</div>
                        )}
                      </div>

                      {/* BUTTON (saves draft + quote, navigates) */}
                      <button
                        onClick={onContinueToBilling}
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold active:scale-[0.98] ${
                          emailOk && addressOk && !goodsUploading
                            ? "bg-black text-white hover:bg-gray-900"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                        disabled={!emailOk || !addressOk || goodsUploading}
                      >
                        Continue to booking →
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">Fill in the route + package to see an estimate.</div>
                  )}
                </div>

                {/* tiny helper */}
                <div className="text-[11px] text-gray-500">
                  Booking key: <span className="font-mono">{shipmentKey.slice(0, 8)}…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose service cards */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Choose your service</h2>

          {/* parcel tiers */}
          <div className="mt-6 grid md:grid-cols-3 gap-4 sm:gap-6">
            <Tier
              active={serviceType === "parcel" && parcelLevel === "standard"}
              name="Standard"
              desc="Budget-friendly, door-to-door."
              eta="2–5 business days"
              weight="Up to 70 kg per piece"
              features={["End-to-end tracking", "Signature on delivery", "Basic customs support"]}
              onClick={() => selectAndScroll({ type: "parcel", level: "standard" })}
            />
            <Tier
              active={serviceType === "parcel" && parcelLevel === "express"}
              highlight
              name="Express"
              desc="Best value for speed and price."
              eta="24–72 hours"
              weight="Up to 70 kg per piece"
              features={["Priority handling", "Time-definite delivery", "Proactive notifications"]}
              onClick={() => selectAndScroll({ type: "parcel", level: "express" })}
            />
            <Tier
              active={serviceType === "parcel" && parcelLevel === "priority"}
              name="Priority"
              desc="Fastest possible transit."
              eta="12–48 hours"
              weight="Up to 70 kg per piece"
              features={["Earliest cut-offs", "First-flight out", "Dedicated support channel"]}
              onClick={() => selectAndScroll({ type: "parcel", level: "priority" })}
            />
          </div>

          {/* freight modes */}
          <h3 className="mt-10 text-xl font-semibold">Freight</h3>
          <div className="mt-4 grid md:grid-cols-3 gap-4 sm:gap-6">
            <Tier
              active={serviceType === "freight" && freightMode === "air"}
              name="Air Freight"
              desc="Fast international cargo on commercial flights."
              eta="2–7 days"
              weight="Per pallet 100–1000 kg"
              features={["Chargeable weight /6000", "Airport security", "Priority uplift options"]}
              onClick={() => selectAndScroll({ type: "freight", mode: "air" })}
            />
            <Tier
              active={serviceType === "freight" && freightMode === "sea"}
              name="Sea Freight"
              desc="Best for very heavy shipments and containers."
              eta="12–35 days"
              weight="LCL/FCL — 20’/40’"
              features={["Cost-efficient", "Global ports", "Customs brokerage"]}
              onClick={() => selectAndScroll({ type: "freight", mode: "sea" })}
            />
            <Tier
              active={serviceType === "freight" && freightMode === "road"}
              name="Road Freight"
              desc="Regional pallets and LTL/FTL moves."
              eta="2–10 days"
              weight="Up to equipment limits"
              features={["Liftgate options", "Appointments", "Inside delivery"]}
              onClick={() => selectAndScroll({ type: "freight", mode: "road" })}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How it works</h2>
            <span className="hidden md:inline-block text-sm text-gray-500">Fast, simple, reliable</span>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-4 sm:gap-6">
            <Step index={1} title="Create" text="Enter addresses, declare contents, print label or request pickup." />
            <Step index={2} title="Handoff" text="We collect at your door or you drop off at a service point." />
            <Step index={3} title="Track" text="Live updates at every scan until delivery with proof of delivery." />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Why GlobalEdge?</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Feature icon={<ShieldIcon />} title="Customs pre-clearance" text="Automated HS codes and document checks reduce border delays." />
            <Feature icon={<BellIcon />} title="Proactive alerts" text="Get notified for exceptions and delivery attempts in real time." />
            <Feature icon={<MapIcon />} title="220+ destinations" text="Strong last-mile partners for reliable global coverage." />
            <Feature icon={<ClockIcon />} title="Time-definite" text="Choose delivery windows where available for business addresses." />
            <Feature icon={<BoxIcon />} title="Packaging help" text="Guides and templates to protect fragile or high-value items." />
            <Feature icon={<LockIcon />} title="Insurance options" text="Optional cover for declared value and sensitive shipments." />
          </div>
        </div>
      </section>

      {/* SLA & limits */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Service commitments</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <Th>Level</Th>
                  <Th>Transit time</Th>
                  <Th>Pickup</Th>
                  <Th>Max piece weight</Th>
                  <Th>Dimensional divisor</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <Tr>
                  <Td>Standard</Td>
                  <Td>2–5 business days</Td>
                  <Td>Same/next day</Td>
                  <Td>70 kg</Td>
                  <Td>5000 (cm)</Td>
                </Tr>
                <Tr>
                  <Td>Express</Td>
                  <Td>24–72 hours</Td>
                  <Td>Same day</Td>
                  <Td>70 kg</Td>
                  <Td>5000 (cm)</Td>
                </Tr>
                <Tr>
                  <Td>Priority</Td>
                  <Td>12–48 hours</Td>
                  <Td>Same day (earliest cut-offs)</Td>
                  <Td>70 kg</Td>
                  <Td>5000 (cm)</Td>
                </Tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Times are estimates and may vary by route, weather, or customs requirements. See full terms at checkout.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">FAQs</h2>
          <div className="mt-6 divide-y rounded-2xl border">
            {[
              {
                q: "What documents do I need for international shipments?",
                a: "Commercial invoice, product descriptions with HS codes, and receiver details. Our flow guides you and generates docs automatically.",
              },
              {
                q: "How is the price calculated?",
                a: "We charge the greater of actual or volumetric weight plus surcharges. You’ll see a breakdown before you pay.",
              },
              { q: "Can I schedule a pickup?", a: "Yes — choose a same-day or future time window during booking in most serviced cities." },
              { q: "Do you deliver on weekends?", a: "Some lanes support Saturday delivery. You’ll see weekend options at checkout if available for your route." },
            ].map((item, i) => (
              <FaqItem key={i} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Need help with a shipment?</h3>
            <p className="mt-2 text-gray-600">Our 24/7 team can assist with pickups, customs, and delivery issues.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/#support" className="px-4 py-2 rounded-xl bg-black text-white font-semibold active:scale-[0.98]">
                Chat with support
              </a>
              <a href="/#support" className="px-4 py-2 rounded-xl bg-white border font-semibold active:scale-[0.98]">
                Open a ticket
              </a>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-gray-200 grid place-items-center text-gray-400">
            <span className="text-sm">Support illustration</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- small UI bits ---------- */
function DividerLabel({ text }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-gray-200" />
      <div className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{text}</div>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function LabeledInput({ label, compact, className = "", ...rest }) {
  return (
    <label className="block">
      <span className={`block ${compact ? "text-xs" : "text-sm"} text-gray-600`}>{label}</span>
      <input
        {...rest}
        className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-200 ${
          compact ? "text-sm" : ""
        } ${className}`}
      />
    </label>
  );
}

function TogglePill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
        active ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-white hover:bg-gray-50"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
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

function Tier({ name, desc, eta, weight, features, highlight, onClick, active }) {
  return (
    <article
      onClick={onClick}
      className={`relative p-6 rounded-2xl border shadow-sm cursor-pointer transition
        ${highlight ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}
        ${active ? "ring-2 ring-red-500" : "hover:shadow-md"}`}
    >
      {highlight && (
        <span className="absolute -top-3 right-4 text-[10px] font-semibold px-2 py-1 rounded-full bg-red-600 text-white">
          Most popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        <li>
          <CheckIcon /> Transit: {eta}
        </li>
        <li>
          <CheckIcon /> {weight}
        </li>
        {features.map((f, i) => (
          <li key={i}>
            <CheckIcon /> {f}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Step({ index, title, text }) {
  return (
    <div className="group relative overflow-hidden p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      <div className="pointer-events-none absolute -right-4 -bottom-6 text-7xl font-black text-red-100/60">{index}</div>
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 grid place-items-center">
          <BoxIcon />
        </div>
        <h3 className="mt-4 font-semibold text-lg">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{text}</p>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:shadow-sm transition">
      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 grid place-items-center">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{text}</p>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left px-4 py-3 font-semibold">{children}</th>;
}
function Tr({ children }) {
  return <tr className="odd:bg-white even:bg-gray-50">{children}</tr>;
}
function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>;
}

/* ---------- tiny icons & utils ---------- */
function LightningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M11 21 3 13h6L7 3h10l-4 8h6z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline w-4 h-4 mr-1 -mt-0.5 align-middle"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 8a6 6 0 1 1 12 0v4l2 3H4l2-3z" />
      <path d="M9 18a3 3 0 0 0 6 0" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7l9 4 9-4M3 7l9-4 9 4M3 7v10l9 4 9-4V7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
function formatMoney(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function tailCountry(s = "") {
  return s.trim().split(",").slice(-1)[0]?.toLowerCase().trim();
}
function isEmail(v = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
function humanSize(bytes) {
  const b = Number(bytes || 0);
  if (b < 1024) return `${b}B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
}

/* ---------- FAQ item ---------- */
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
