// src/utils/storage.js
// ------------------------------------------------------------------
// Resilient storage helpers for the shipping flow.
// ✅ Draft (in-progress shipment) -> sessionStorage (fast, per-tab)
// ✅ Receipt(s) (successful booking) -> localStorage (survives refresh)
// - Safe JSON parsing
// - Key migration (legacy -> current)
// - Light normalization so JSON.stringify doesn’t choke (File/Blob/etc.)
// - Compatibility aliases: loadDraft, loadReceipt
// ------------------------------------------------------------------

/* KEYS (current + legacy aliases for migration) */
const KEYS = {
  draft: {
    current: "ge_draft_shipment",
    legacy: ["ge_draft", "ge_draft_shipment_v1"],
  },
  receipt: {
    // “last receipt” pointer (keeps your current usage working)
    current: "ge_last_receipt",
    legacy: ["ge_receipt_last", "ge_receipt"],
  },

  // Optional: keep history of receipts (nice for Dashboard/History)
  receiptsList: {
    current: "ge_receipts",
    legacy: ["ge_receipts_list"],
  },

  // Optional: per-id receipt cache (super reliable restore)
  receiptByIdPrefix: "ge_receipt_", // final key => ge_receipt_<id>
};

/* ---------------- safe primitives ---------------- */
function getStore(where) {
  if (typeof window === "undefined") return null;
  return where === "local" ? window.localStorage : window.sessionStorage;
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function readRaw(key, where) {
  try {
    const store = getStore(where);
    if (!store) return null;
    return store.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key, raw, where) {
  try {
    const store = getStore(where);
    if (!store) return;
    if (raw === null) store.removeItem(key);
    else store.setItem(key, raw);
  } catch {
    /* ignore */
  }
}

function removeKey(key, where) {
  try {
    const store = getStore(where);
    if (!store) return;
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

/* -------------- tiny validators (non-strict) -------------- */
function isObj(v) {
  return v && typeof v === "object";
}

// Keep draft validator NON-STRICT: you may build draft progressively across steps.
function looksLikeDraft(v) {
  return isObj(v);
}

// Receipt should be an object; allow minimal fields to pass.
function looksLikeReceipt(v) {
  return isObj(v) && (isObj(v.quote) || isObj(v.totals) || v.trackingId || v.shipmentId || v.id);
}

/* -------------- normalization (avoid JSON bombs) ----------- */
function stripNonSerializable(v) {
  // Remove File/Blob, functions, circular refs, etc.
  // We keep it simple: build a JSON-safe clone best-effort.

  const seen = new WeakSet();

  const walk = (x) => {
    if (x === null || x === undefined) return x;

    const t = typeof x;
    if (t === "string" || t === "number" || t === "boolean") return x;

    // Dates -> ISO
    if (x instanceof Date) return x.toISOString();

    // File / Blob -> metadata only
    if (typeof File !== "undefined" && x instanceof File) {
      return { __file: true, name: x.name, size: x.size, type: x.type, lastModified: x.lastModified };
    }
    if (typeof Blob !== "undefined" && x instanceof Blob) {
      return { __blob: true, size: x.size, type: x.type };
    }

    if (Array.isArray(x)) return x.map(walk);

    if (t === "function") return undefined;

    if (t === "object") {
      if (seen.has(x)) return undefined; // prevent circular refs
      seen.add(x);

      const out = {};
      for (const k of Object.keys(x)) {
        const val = walk(x[k]);
        if (val !== undefined) out[k] = val;
      }
      return out;
    }

    return undefined;
  };

  return walk(v);
}

function normalizeDraft(draft) {
  if (!isObj(draft)) return draft;

  // Optional: normalize goodsPhotos fields (supports your earlier Billing flow)
  const goodsPhotosMeta =
    Array.isArray(draft.goodsPhotosMeta) ? draft.goodsPhotosMeta
    : Array.isArray(draft.goodsPhotos) ? draft.goodsPhotos
    : [];

  const goodsPhotosUrls = goodsPhotosMeta
    .map((p) => (typeof p === "string" ? p : p?.url))
    .filter(Boolean);

  const next = {
    ...draft,
    goodsPhotosMeta,
    goodsPhotos: goodsPhotosMeta, // keep legacy name stable
    goodsPhotosUrls,
    updatedAt: draft.updatedAt || new Date().toISOString(),
  };

  // Make sure it’s serializable
  return stripNonSerializable(next);
}

function normalizeReceipt(receipt) {
  if (!isObj(receipt)) return receipt;
  const next = {
    ...receipt,
    ts: receipt.ts || new Date().toISOString(),
  };
  return stripNonSerializable(next);
}

/* -------------- migration helper (once per get) ------------ */
function migrateGet({ current, legacy }, where, validator) {
  // current
  const curRaw = readRaw(current, where);
  const cur = safeParse(curRaw);
  if (validator(cur)) return cur;

  // legacy -> current
  for (const k of legacy || []) {
    const raw = readRaw(k, where);
    const val = safeParse(raw);
    if (validator(val)) {
      // save under current, remove legacy
      writeRaw(current, safeStringify(val), where);
      removeKey(k, where);
      return val;
    }
  }
  return null;
}

/* ============================================================
   DRAFT (session)
   ============================================================ */

export function saveDraft(draft) {
  const normalized = normalizeDraft(draft);

  const raw = safeStringify(normalized);
  if (raw === null) {
    // last resort: store stripped version
    const fallback = safeStringify(stripNonSerializable(normalized));
    if (fallback !== null) writeRaw(KEYS.draft.current, fallback, "session");
    return;
  }
  writeRaw(KEYS.draft.current, raw, "session");
}

export function getDraft() {
  // Try migrate + return whatever object is there (non-strict)
  const v = migrateGet(KEYS.draft, "session", looksLikeDraft);
  return v || null;
}

export function updateDraft(patch) {
  const cur = getDraft() || {};
  const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
  saveDraft(next);
  return next;
}

export function clearDraft() {
  removeKey(KEYS.draft.current, "session");
}

// ✅ Compatibility alias
export const loadDraft = getDraft;

/* ============================================================
   RECEIPTS (local)
   - saveReceipt(receipt): saves last receipt + list + per-id cache
   - getReceipt(id?): returns per-id if provided else last receipt
   ============================================================ */

function readReceiptsList() {
  const list = migrateGet(KEYS.receiptsList, "local", (x) => Array.isArray(x));
  return Array.isArray(list) ? list : [];
}

function writeReceiptsList(list) {
  const raw = safeStringify(list);
  if (raw !== null) writeRaw(KEYS.receiptsList.current, raw, "local");
}

export function saveReceipt(receipt) {
  const normalized = normalizeReceipt(receipt);
  const raw = safeStringify(normalized);
  if (raw === null) return;

  // 1) save last receipt
  writeRaw(KEYS.receipt.current, raw, "local");

  // 2) save per-id (if id exists)
  const rid = normalized?.id;
  if (rid) {
    writeRaw(`${KEYS.receiptByIdPrefix}${rid}`, raw, "local");
  }

  // 3) update receipts list (dedupe, keep 50)
  const list = readReceiptsList();
  if (rid) {
    const idx = list.findIndex((r) => String(r?.id) === String(rid));
    if (idx >= 0) list[idx] = normalized;
    else list.unshift(normalized);
  } else {
    list.unshift(normalized);
  }
  writeReceiptsList(list.slice(0, 50));
}

export function getReceipt(id) {
  // If id is provided: try per-id first
  if (id) {
    const raw = readRaw(`${KEYS.receiptByIdPrefix}${id}`, "local");
    const val = safeParse(raw);
    if (looksLikeReceipt(val)) return val;

    // fallback: search list
    const list = readReceiptsList();
    const found = list.find((r) => String(r?.id) === String(id));
    if (looksLikeReceipt(found)) return found;
  }

  // Otherwise: return last receipt (migrate too)
  const v = migrateGet(KEYS.receipt, "local", looksLikeReceipt);
  return v || null;
}

export function getReceipts() {
  return readReceiptsList();
}

export function clearReceipt() {
  removeKey(KEYS.receipt.current, "local");
}

export function clearReceipts() {
  removeKey(KEYS.receiptsList.current, "local");
  // NOTE: per-id caches remain unless you explicitly delete them (no easy prefix delete).
}

// ✅ Compatibility alias (your pages might import loadReceipt)
export const loadReceipt = getReceipt;

/* ============================================================
   Convenience
   ============================================================ */

export function getStoredState() {
  return {
    draft: getDraft(),
    receipt: getReceipt(),
    receipts: getReceipts(),
  };
}

export function clearAllStorage() {
  clearDraft();
  clearReceipt();
  clearReceipts();
}
