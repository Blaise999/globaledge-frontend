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

  // stable key for this booking session (folder for Blob + draft key)
  const [shipmentKey] = useState(() => {
    const c = globalThis.crypto;
    return c?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  });

  // parcel form
  const [parcel, setParcel] = useState({
    from: "",
    to: "",
    shipperName: "",
    shipperEmail: "",
    shipperPhone: "",
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    recipientAddress: "",
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
    shipperName: "",
    shipperEmail: "",
    shipperPhone: "",
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    recipientAddress: "",
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
  const dropRef = useRef(null);

  const [goodsUploading, setGoodsUploading] = useState(false);
  const [goodsUploadErr, setGoodsUploadErr] = useState("");
  const [goodsPhotos, setGoodsPhotos] = useState([]); // [{ url, pathname, size, contentType, name }]
  const [uploadingNames, setUploadingNames] = useState([]); // small UX nicety
  const [activePreview, setActivePreview] = useState(null); // url

  function safeName(name = "photo") {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  function removeGoodsPhoto(url) {
    setGoodsPhotos((prev) => prev.filter((p) => p.url !== url));
    if (activePreview === url) setActivePreview(null);
  }

  async function uploadGoodsPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setGoodsUploadErr("");

    const remainingSlots = Math.max(0, GOODS_MAX - goodsPhotos.length);
    const chosen = files.slice(0, remainingSlots);

    if (!chosen.length) {
      setGoodsUploadErr(`You can upload up to ${GOODS_MAX} photos.`);
      return;
    }

    // validate first (friendlier)
    for (const f of chosen) {
      if (!f.type?.startsWith("image/")) {
        setGoodsUploadErr("Only image files are allowed (JPG/PNG/WEBP).");
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setGoodsUploadErr(`Max ${MAX_MB}MB per photo.`);
        return;
      }
    }

    setGoodsUploading(true);
    setUploadingNames(chosen.map((f) => f.name));

    try {
      const uploaded = [];
      for (const file of chosen) {
        const pathname = `shipments/${shipmentKey}/goods/${Date.now()}-${safeName(file.name)}`;

        // Requires your token endpoint:
        // POST /api/goods/upload (server) -> returns a vercel blob client token
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
      setGoodsUploadErr(e?.message || "Upload failed. Please try again.");
    } finally {
      setGoodsUploading(false);
      setUploadingNames([]);
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
      setTimeout(
        () => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        0
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: select a service/mode/level and jump to estimator
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
    const l = +parcel.length || 0;
    const w = +parcel.width || 0;
    const h = +parcel.height || 0;
    const vol = l && w && h ? (l * w * h) / 5000 : 0;
    return round2(vol);
  }, [parcel.length, parcel.width, parcel.height]);

  const billableParcel = useMemo(() => {
    const actual = +parcel.weight || 0;
    return Math.max(actual, volumetricParcel);
  }, [parcel.weight, volumetricParcel]);

  // ---------------- calcs: freight ----------------
  const volumetricFreight = useMemo(() => {
    const l = +freight.length || 0;
    const w = +freight.width || 0;
    const h = +freight.height || 0;
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

    const fuel = 0.12;
    const security = 3.0;

    const subtotal = (base + billableParcel * perKg) * speedMult;
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

  }, [parcel.from, parcel.to, billableParcel, parcelLevel, parcel.recipientEmail, parcel.recipientAddress]);

  const freightQuote = useMemo(() => {
    if (!freight.from || !freight.to || !billableFreight) return null;

    const modeBase = freightMode === "air" ? 150 : freightMode === "sea" ? 90 : 120;
    const perKg = freightMode === "air" ? 2.2 : freightMode === "sea" ? 1.0 : 1.4;

    const sameCountry = tailCountry(freight.from) === tailCountry(freight.to);
    const domesticDiscount = sameCountry ? 0.85 : 1;

    const fuel = freightMode === "air" ? 0.18 : 0.08;
    const security = freightMode === "air" ? 12 : 6;

    const subtotal = (modeBase + billableFreight * perKg) * domesticDiscount;
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
  }, [freight.from, freight.to, billableFreight, freightMode, freight.recipientEmail, freight.recipientAddress]);

  const quote = serviceType === "parcel" ? parcelQuote : freightQuote;

  // email + address gating
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
        level: parcelLevel,
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

    // attach quote snapshot
    draft.price = quote.total;
    draft.currency = quote.currency;
    draft.eta = quote.eta;
    draft.billable = quote.billable;

    // attach goods photos (Blob URLs) so Tracking can show them later
    draft.shipmentKey = shipmentKey;
    draft.goodsPhotos = goodsPhotos;

    saveDraft(draft);
    navigate("/Billing", { state: { fromEstimator: true } });
  }

  // drag & drop (no extra libs)
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onDrop = (e) => {
      stop(e);
      if (goodsUploading) return;
      if (e.dataTransfer?.files?.length) uploadGoodsPhotos(e.dataTransfer.files);
      el.classList.remove("ring-2", "ring-red-500/30");
    };

    const onDragEnter = (e) => {
      stop(e);
      el.classList.add("ring-2", "ring-red-500/30");
    };

    const onDragLeave = (e) => {
      stop(e);
      el.classList.remove("ring-2", "ring-red-500/30");
    };

    el.addEventListener("dragenter", onDragEnter);
    el.addEventListener("dragover", stop);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);

    return () => {
      el.removeEventListener("dragenter", onDragEnter);
      el.removeEventListener("dragover", stop);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goodsUploading, goodsPhotos.length]);

  const titleLine =
    serviceType === "parcel"
      ? parcelLevel === "standard"
        ? "Standard parcel"
        : parcelLevel === "express"
        ? "Express parcel"
        : "Priority parcel"
      : freightMode === "air"
      ? "Air freight"
      : freightMode === "sea"
      ? "Sea freight"
      : "Road freight";

  const billableText = quote?.billable ? `${quote.billable} kg billable` : "—";
  const canContinue = Boolean(quote) && emailOk && addressOk && !goodsUploading;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
              <div className="hidden sm:block leading-tight">
                <div className="text-sm font-semibold">GlobalEdge</div>
                <div className="text-[11px] text-gray-500 -mt-0.5">Speed without borders</div>
              </div>
            </a>

            <div className="flex items-center gap-2">
              <Link
                to="/track"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <PinIcon /> Track
              </Link>

              <a
                href="#support"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black"
              >
                <HeadsetIcon /> Support
              </a>

              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeftIcon /> Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO / QUOTE */}
      <section className="relative overflow-hidden">
        {/* 2026-ish background: soft gradient + subtle grid */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_15%_10%,rgba(220,38,38,0.25),transparent_55%),radial-gradient(900px_500px_at_90%_10%,rgba(0,0,0,0.12),transparent_60%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.00))]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left copy */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                <SparkIcon /> New booking flow
                <span className="ml-1 rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px]">2026</span>
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                Create a shipment in minutes.
              </h1>

              <p className="mt-4 text-gray-700 max-w-prose">
                Pick a service, add contacts and package details, upload goods photos (optional), and continue to
                checkout. Transparent pricing + live tracking on every scan.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#quote"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-[0.98]"
                >
                  Get a quote <ChevronDownIcon />
                </a>
                <Link
                  to="/track"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white/70 font-semibold text-gray-800 hover:bg-white active:scale-[0.98]"
                >
                  Track shipment <PinIcon />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-3">
                <MiniStat label="Live tracking" value="Every scan" />
                <MiniStat label="Coverage" value="220+ lanes" />
                <MiniStat label="Support" value="24/7" />
              </div>

              <div className="mt-10 rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Selected</div>
                    <div className="text-lg font-semibold">{titleLine}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Billable</div>
                    <div className="text-sm font-semibold">{billableText}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <SoftPill active={serviceType === "parcel"} onClick={() => setServiceType("parcel")}>
                    Parcel
                  </SoftPill>
                  <SoftPill active={serviceType === "freight"} onClick={() => setServiceType("freight")}>
                    Freight
                  </SoftPill>
                  <SoftPill active onClick={() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" })}>
                    Quote
                  </SoftPill>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                  <Dot /> No card required for estimate.
                </div>
              </div>
            </div>

            {/* Right estimator card */}
            <div id="quote" className="lg:col-span-7">
              <div className="rounded-[28px] border border-gray-200 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.10)] overflow-hidden">
                <div className="p-6 bg-gradient-to-b from-white to-gray-50 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Instant quote</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Add shipment details, optionally upload photos, then continue to booking.
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      <StepChip on>1 Quote</StepChip>
                      <StepChip on={goodsPhotos.length > 0}>2 Photos</StepChip>
                      <StepChip on={canContinue}>3 Checkout</StepChip>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid gap-6">
                  {/* Service selector */}
                  <SectionTitle icon={<BoltIcon />} title="Service" subtitle="Choose parcel/freight and speed." />

                  <div className="grid sm:grid-cols-2 gap-2">
                    <SegmentButton
                      title="Parcel"
                      desc="Door-to-door parcels"
                      active={serviceType === "parcel"}
                      onClick={() => setServiceType("parcel")}
                    />
                    <SegmentButton
                      title="Freight"
                      desc="Air / sea / road cargo"
                      active={serviceType === "freight"}
                      onClick={() => setServiceType("freight")}
                    />
                  </div>

                  {serviceType === "parcel" ? (
                    <div className="grid sm:grid-cols-3 gap-2">
                      <ChipButton active={parcelLevel === "standard"} onClick={() => setParcelLevel("standard")}>
                        Standard
                      </ChipButton>
                      <ChipButton active={parcelLevel === "express"} onClick={() => setParcelLevel("express")}>
                        Express
                      </ChipButton>
                      <ChipButton active={parcelLevel === "priority"} onClick={() => setParcelLevel("priority")}>
                        Priority
                      </ChipButton>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-3 gap-2">
                      <ChipButton active={freightMode === "air"} onClick={() => setFreightMode("air")}>
                        Air
                      </ChipButton>
                      <ChipButton active={freightMode === "sea"} onClick={() => setFreightMode("sea")}>
                        Sea
                      </ChipButton>
                      <ChipButton active={freightMode === "road"} onClick={() => setFreightMode("road")}>
                        Road
                      </ChipButton>
                    </div>
                  )}

                  {/* Route & contacts */}
                  <SectionTitle icon={<MapIcon />} title="Route & contacts" subtitle="Who’s sending, who’s receiving." />

                  <div className="grid sm:grid-cols-2 gap-3">
                    {serviceType === "parcel" ? (
                      <>
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

                        <DividerLabel text="Shipper (Sender)" />

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
                          placeholder="+44 801 234 5678"
                          className="sm:col-span-2"
                        />

                        <DividerLabel text="Recipient" />

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
                        <LabeledTextarea
                          label="Recipient address"
                          value={parcel.recipientAddress}
                          onChange={(e) => setParcel((s) => ({ ...s, recipientAddress: e.target.value }))}
                          placeholder="Street, city, postcode…"
                          className="sm:col-span-2"
                        />
                      </>
                    ) : (
                      <>
                        <LabeledInput
                          label="From (City, Country)"
                          value={freight.from}
                          onChange={(e) => setFreight((s) => ({ ...s, from: e.target.value }))}
                          placeholder="Lisbon, Portugal"
                        />
                        <LabeledInput
                          label="To (City, Country)"
                          value={freight.to}
                          onChange={(e) => setFreight((s) => ({ ...s, to: e.target.value }))}
                          placeholder="Rotterdam, Netherlands"
                        />

                        <DividerLabel text="Shipper (Sender)" />

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
                          placeholder="+44 801 234 5678"
                          className="sm:col-span-2"
                        />

                        <DividerLabel text="Recipient" />

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
                        <LabeledTextarea
                          label="Recipient address"
                          value={freight.recipientAddress}
                          onChange={(e) => setFreight((s) => ({ ...s, recipientAddress: e.target.value }))}
                          placeholder="Warehouse, street, city, postcode…"
                          className="sm:col-span-2"
                        />
                      </>
                    )}
                  </div>

                  {/* Goods photos */}
                  <SectionTitle
                    icon={<CameraIcon />}
                    title="Goods photos"
                    subtitle="Optional — helps verification & can show on tracking."
                    right={
                      <span className="text-xs text-gray-500">
                        {goodsPhotos.length}/{GOODS_MAX}
                      </span>
                    }
                  />

                  <div
                    ref={dropRef}
                    className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Add pictures of the goods</div>
                        <div className="mt-0.5 text-xs text-gray-600">
                          Drag & drop here or choose files. Max <b>{MAX_MB}MB</b> each • JPG/PNG/WEBP.
                        </div>
                        {goodsUploading && uploadingNames.length ? (
                          <div className="mt-2 text-[11px] text-gray-700">
                            Uploading: <span className="font-medium">{uploadingNames.join(", ")}</span>
                          </div>
                        ) : null}
                        {goodsUploadErr ? <div className="mt-2 text-xs text-red-600">{goodsUploadErr}</div> : null}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
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
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold active:scale-[0.98] ${
                            goodsUploading || goodsPhotos.length >= GOODS_MAX
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-gray-900 text-white hover:bg-black"
                          }`}
                        >
                          <PlusIcon />
                          {goodsUploading ? "Uploading…" : goodsPhotos.length ? "Add more" : "Add photos"}
                        </button>

                        {goodsPhotos.length ? (
                          <button
                            type="button"
                            onClick={() => setGoodsPhotos([])}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
                          >
                            <TrashIcon /> Clear
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {goodsPhotos.length ? (
                      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {goodsPhotos.map((p) => (
                          <button
                            key={p.url}
                            type="button"
                            onClick={() => setActivePreview(p.url)}
                            className="group relative overflow-hidden rounded-xl border bg-white text-left"
                            title="Click to preview"
                          >
                            <img src={p.url} alt={p.name || "Goods"} className="w-full aspect-square object-cover" />
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                              <div className="text-[10px] text-white/90 truncate">
                                {p.name || "photo"} • {humanSize(p.size || 0)}
                              </div>
                            </div>
                            <span className="absolute top-2 left-2 rounded-full bg-white/90 text-gray-900 text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                              Preview
                            </span>
                            <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                              <span
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeGoodsPhoto(p.url);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-black/70 text-white text-[11px] px-2 py-1"
                              >
                                <XIcon /> Remove
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed bg-white px-4 py-6 text-center">
                        <div className="mx-auto w-11 h-11 rounded-2xl bg-red-50 text-red-700 grid place-items-center">
                          <CameraIcon />
                        </div>
                        <div className="mt-3 text-sm font-semibold">No photos yet</div>
                        <div className="mt-1 text-xs text-gray-600">
                          Add photos to make verification and exception handling faster.
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-[11px] text-gray-500">
                      Note: uploads go straight to Blob. Removing here only removes it from this booking draft.
                    </div>
                  </div>

                  {/* Package details */}
                  <SectionTitle icon={<BoxIcon />} title="Package details" subtitle="Weight + dimensions for pricing." />

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

                      <InfoRow className="sm:col-span-2">
                        Volumetric <b>{volumetricParcel || 0} kg</b> • Billable <b>{billableParcel || 0} kg</b>
                      </InfoRow>
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
                        <InfoRow className="sm:col-span-2 self-end">
                          Volumetric <b>{volumetricFreight || 0} kg</b> • Billable <b>{billableFreight || 0} kg</b>
                        </InfoRow>
                      </div>
                    </div>
                  )}

                  {/* Quote footer */}
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
                    {quote ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Estimated total</div>
                          <div className="mt-1 text-3xl font-black tracking-tight">
                            {quote.currency} {formatMoney(quote.total)}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            ETA: <b className="text-gray-900">{quote.eta}</b> • {quote.billable} kg billable
                          </div>

                          {!emailOk ? (
                            <div className="mt-2 text-xs text-red-600">
                              Enter a valid <b>recipient email</b> to continue.
                            </div>
                          ) : null}
                          {!addressOk ? (
                            <div className="mt-1 text-xs text-red-600">
                              Enter the <b>recipient street address</b> to continue.
                            </div>
                          ) : null}
                          {goodsUploading ? (
                            <div className="mt-1 text-xs text-gray-700">Uploading photos… please wait.</div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          <button
                            onClick={onContinueToBilling}
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold active:scale-[0.98] ${
                              canContinue
                                ? "bg-gray-900 text-white hover:bg-black"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                            disabled={!canContinue}
                          >
                            Continue to booking <ArrowRightIcon />
                          </button>

                          <div className="text-[11px] text-gray-500">
                            Booking key: <span className="font-mono">{shipmentKey.slice(0, 8)}…</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Fill in route + package details to see an estimate.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo preview modal */}
          {activePreview ? (
            <PreviewModal
              url={activePreview}
              onClose={() => setActivePreview(null)}
              onRemove={() => removeGoodsPhoto(activePreview)}
            />
          ) : null}
        </div>
      </section>

      {/* Choose service cards */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Choose your service</h2>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <Dot /> Clear pricing
              <Dot /> Live tracking
              <Dot /> Customs support
            </div>
          </div>

          <div className="mt-7 grid md:grid-cols-3 gap-4 sm:gap-6">
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

          <h3 className="mt-12 text-xl font-semibold">Freight</h3>
          <div className="mt-4 grid md:grid-cols-3 gap-4 sm:gap-6">
            <Tier
              active={serviceType === "freight" && freightMode === "air"}
              name="Air Freight"
              desc="Fast international cargo on flights."
              eta="2–7 days"
              weight="Per pallet 100–1000 kg"
              features={["Chargeable weight /6000", "Airport security", "Priority uplift options"]}
              onClick={() => selectAndScroll({ type: "freight", mode: "air" })}
            />
            <Tier
              active={serviceType === "freight" && freightMode === "sea"}
              name="Sea Freight"
              desc="Best for heavy shipments & containers."
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
      <section className="py-14 sm:py-18 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How it works</h2>
            <span className="hidden md:inline-block text-sm text-gray-500">Fast • simple • reliable</span>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4 sm:gap-6">
            <Step index={1} title="Create" text="Enter route, contacts and package details. Add optional goods photos." />
            <Step index={2} title="Handoff" text="We collect at your door or you drop off at a service point." />
            <Step index={3} title="Track" text="Live updates at every scan until delivery with proof-of-delivery." />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Why GlobalEdge?</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Feature
              icon={<ShieldIcon />}
              title="Customs pre-clearance"
              text="Document checks and compliance support reduce border delays."
            />
            <Feature icon={<BellIcon />} title="Proactive alerts" text="Get notified for exceptions and delivery attempts." />
            <Feature icon={<MapIcon />} title="220+ destinations" text="Strong last-mile partners for reliable global coverage." />
            <Feature icon={<ClockIcon />} title="Time-definite lanes" text="Choose faster windows for business-critical shipments." />
            <Feature icon={<BoxIcon />} title="Packaging guidance" text="Tips and templates to protect fragile/high-value items." />
            <Feature icon={<LockIcon />} title="Insurance options" text="Optional cover for declared value and sensitive goods." />
          </div>
        </div>
      </section>

      {/* SLA & limits */}
      <section className="py-14 sm:py-18 bg-gray-50">
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
            Times are estimates and may vary by route, weather, or customs requirements.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">FAQs</h2>
          <div className="mt-6 divide-y rounded-2xl border">
            {[
              {
                q: "What documents do I need for international shipments?",
                a: "Commercial invoice, product descriptions, and receiver details. Our flow guides you and support can help if customs requests anything.",
              },
              {
                q: "How is the price calculated?",
                a: "We charge the greater of actual or volumetric weight plus standard surcharges. You’ll see an estimate before checkout.",
              },
              { q: "Can I schedule a pickup?", a: "Yes — choose a same-day or future time window during booking in most serviced cities." },
              { q: "Do you deliver on weekends?", a: "Some lanes support Saturday delivery. Options show at checkout if available." },
            ].map((item, i) => (
              <FaqItem key={i} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Support CTA (no placeholder image — real “control center” card + SVG) */}
      <section id="support" className="py-14 sm:py-18 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 ring-1 ring-red-100 px-3 py-1 text-xs font-semibold">
              <HeadsetIcon /> GlobalEdge Support
            </div>

            <h3 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">Need help with a shipment?</h3>
            <p className="mt-2 text-gray-600">
              Our team can assist with pickups, customs requests, exceptions, and delivery coordination.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="mailto:Globaledgeshippings@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black active:scale-[0.98]"
              >
                <MailIcon /> Email support
              </a>
              <a
                href="/#support"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 active:scale-[0.98]"
              >
                <ChatIcon /> Live chat
              </a>
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              <SupportBadge title="Response" value="Fast" />
              <SupportBadge title="Availability" value="24/7" />
              <SupportBadge title="Customs" value="Assisted" />
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Shipment control center</div>
                  <div className="text-xs text-gray-500">Example preview</div>
                </div>
              </div>

              <div className="p-5">
                <MiniTimeline />
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <WorldRouteArt />
                </div>

                <div className="mt-4 text-xs text-gray-600">
                  Tip: Uploading goods photos helps resolve exceptions faster (customs checks, packaging verification, and damage claims).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ========================= UI bits ========================= */

function SectionTitle({ icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-700 grid place-items-center">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle ? <div className="text-xs text-gray-600 mt-0.5">{subtitle}</div> : null}
        </div>
      </div>
      {right ? <div className="pt-1">{right}</div> : null}
    </div>
  );
}

function DividerLabel({ text }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-gray-200" />
      <div className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{text}</div>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function LabeledInput({ label, compact, className = "", ...rest }) {
  return (
    <label className={`block ${className}`}>
      <span className={`block ${compact ? "text-xs" : "text-sm"} text-gray-600`}>{label}</span>
      <input
        {...rest}
        className={`mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none transition
        focus:ring-2 focus:ring-red-500/20 focus:border-red-200
        ${compact ? "text-sm" : ""}`}
      />
    </label>
  );
}

function LabeledTextarea({ label, className = "", ...rest }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm text-gray-600">{label}</span>
      <textarea
        {...rest}
        rows={3}
        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none transition
        focus:ring-2 focus:ring-red-500/20 focus:border-red-200 resize-none"
      />
    </label>
  );
}

function InfoRow({ children, className = "" }) {
  return <p className={`text-xs text-gray-600 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 ${className}`}>{children}</p>;
}

function ChipButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm font-semibold transition active:scale-[0.99]
      ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function SegmentButton({ title, desc, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-left transition active:scale-[0.99]
      ${active ? "border-red-200 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-gray-600 mt-0.5">{desc}</div>
        </div>
        <div className={`w-9 h-9 rounded-xl grid place-items-center ${active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>
          {active ? <CheckIcon /> : <ArrowRightMini />}
        </div>
      </div>
    </button>
  );
}

function SoftPill({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-semibold border transition active:scale-[0.99]
      ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"}`}
    >
      {children}
    </button>
  );
}

function StepChip({ children, on }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border text-xs font-semibold ${on ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}>
      <span className={`w-2 h-2 rounded-full ${on ? "bg-white" : "bg-gray-300"}`} /> {children}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function Tier({ name, desc, eta, weight, features, highlight, onClick, active }) {
  return (
    <article
      onClick={onClick}
      className={`relative p-6 rounded-3xl border shadow-sm cursor-pointer transition active:scale-[0.99]
        ${highlight ? "border-red-200 bg-gradient-to-b from-red-50 to-white" : "border-gray-200 bg-white"}
        ${active ? "ring-2 ring-red-500/40" : "hover:shadow-md"}`}
    >
      {highlight ? (
        <span className="absolute -top-3 right-5 text-[10px] font-semibold px-2 py-1 rounded-full bg-red-600 text-white">
          Most popular
        </span>
      ) : null}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        <li>
          <CheckIconInline /> Transit: {eta}
        </li>
        <li>
          <CheckIconInline /> {weight}
        </li>
        {features.map((f, i) => (
          <li key={i}>
            <CheckIconInline /> {f}
          </li>
        ))}
      </ul>

      <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
        <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-red-600" : "bg-gray-300"}`} />
        {active ? "Selected" : "Select"}
      </div>
    </article>
  );
}

function Step({ index, title, text }) {
  return (
    <div className="group relative overflow-hidden p-6 rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      <div className="pointer-events-none absolute -right-4 -bottom-8 text-7xl font-black text-red-100/70">{index}</div>
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-700 grid place-items-center">
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
    <div className="p-6 rounded-3xl border border-gray-200 bg-white hover:shadow-sm transition">
      <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-700 grid place-items-center">{icon}</div>
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

function SupportBadge({ title, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

/* ========================= Preview modal ========================= */

function PreviewModal({ url, onClose, onRemove }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm grid place-items-center p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-3xl rounded-3xl overflow-hidden bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="text-sm font-semibold">Photo preview</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            >
              <TrashIcon /> Remove
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50"
            >
              <XIcon /> Close
            </button>
          </div>
        </div>
        <div className="bg-black">
          <img src={url} alt="Preview" className="w-full max-h-[70vh] object-contain" />
        </div>
      </div>
    </div>
  );
}

/* ========================= FAQ item ========================= */

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-4 px-4 text-left text-sm font-semibold hover:bg-gray-50"
      >
        <span>{q}</span>
        <ChevronDownTiny className={`w-4 h-4 transform transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="px-4 pb-4 text-sm text-gray-600">{a}</div> : null}
    </div>
  );
}

/* ========================= Support “art” ========================= */

function MiniTimeline() {
  const rows = [
    { t: "Label created", s: "Now", dot: "bg-gray-900" },
    { t: "Picked up", s: "Next", dot: "bg-gray-300" },
    { t: "In transit", s: "Soon", dot: "bg-gray-300" },
    { t: "Out for delivery", s: "Later", dot: "bg-gray-300" },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-sm font-semibold">Live updates</div>
      <div className="mt-3 space-y-3">
        {rows.map((r) => (
          <div key={r.t} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
              <span className="text-sm text-gray-800">{r.t}</span>
            </div>
            <span className="text-xs text-gray-500">{r.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorldRouteArt() {
  return (
    <svg viewBox="0 0 640 260" className="w-full h-auto">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(220,38,38,0.85)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.85)" />
        </linearGradient>
        <radialGradient id="g2" cx="30%" cy="30%" r="70%">
          <stop offset="0" stopColor="rgba(220,38,38,0.18)" />
          <stop offset="1" stopColor="rgba(220,38,38,0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="640" height="260" rx="18" fill="white" />
      <rect x="0" y="0" width="640" height="260" rx="18" fill="url(#g2)" />

      {/* “world” dots */}
      {Array.from({ length: 220 }).map((_, i) => {
        const x = (i * 37) % 640;
        const y = ((i * 91) % 260);
        const r = (i % 7 === 0 ? 1.6 : 1.0);
        const o = i % 9 === 0 ? 0.22 : 0.12;
        return <circle key={i} cx={x} cy={y} r={r} fill={`rgba(0,0,0,${o})`} />;
      })}

      {/* route arcs */}
      <path
        d="M120 170 C 210 70, 350 70, 460 140"
        fill="none"
        stroke="url(#g1)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M170 190 C 260 120, 380 120, 530 150"
        fill="none"
        stroke="rgba(220,38,38,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="7 9"
      />

      {/* points */}
      <circle cx="120" cy="170" r="7" fill="rgba(220,38,38,0.95)" />
      <circle cx="460" cy="140" r="7" fill="rgba(0,0,0,0.90)" />
      <circle cx="530" cy="150" r="5.5" fill="rgba(220,38,38,0.75)" />

      {/* labels */}
      <text x="120" y="198" fontSize="12" fill="rgba(0,0,0,0.60)" textAnchor="middle">
        Origin
      </text>
      <text x="460" y="112" fontSize="12" fill="rgba(0,0,0,0.60)" textAnchor="middle">
        Hub
      </text>
      <text x="530" y="178" fontSize="12" fill="rgba(0,0,0,0.60)" textAnchor="middle">
        Destination
      </text>
    </svg>
  );
}

/* ========================= Utils ========================= */

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

/* ========================= Icons ========================= */

function Dot() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />;
}
function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2z" />
      <path d="M4 14l.8 3.2L8 18l-3.2.8L4 22l-.8-3.2L0 18l3.2-.8L4 14z" transform="translate(16 -2)" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M11 21 3 13h6L7 3h10l-4 8h6z" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h3l2-2h6l2 2h3v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" />
    </svg>
  );
}
function ArrowRightMini() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function ChevronDownTiny({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5h6v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l1 14h6l1-14" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12a8 8 0 0 1 16 0v6a2 2 0 0 1-2 2h-2" />
      <path d="M6 20H5a2 2 0 0 1-2-2v-3" />
      <rect x="17" y="13" width="4" height="6" rx="2" />
      <rect x="3" y="13" width="4" height="6" rx="2" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8 6 8-6" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.2-4.8A8 8 0 1 1 21 12z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function CheckIconInline() {
  return (
    <svg viewBox="0 0 24 24" className="inline w-4 h-4 mr-1 -mt-0.5 align-middle" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8a6 6 0 1 1 12 0v4l2 3H4l2-3z" />
      <path d="M9 18a3 3 0 0 0 6 0" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7l9 4 9-4M3 7l9-4 9 4M3 7v10l9 4 9-4V7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </svg>
  );
}
