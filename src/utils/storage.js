// src/utils/storage.js
// ------------------------------------------------------------------
// Resilient storage helpers for the shipping flow.
// - Draft (in-progress shipment) -> sessionStorage
// - Receipt (last successful booking) -> localStorage
// Includes safe JSON parsing, key migration, light validation,
// and compatibility alias exports (loadDraft, loadReceipt).
// ------------------------------------------------------------------

/* KEYS (current + legacy aliases for migration) */
const KEYS = {
  draft: {
    current: "ge_draft_shipment",
    legacy: ["ge_draft"], // add more legacy keys here if needed
  },
  receipt: {
    current: "ge_last_receipt",
    legacy: [], // e.g. ["ge_receipt"]
  },
};

/* ---------------- safe storage primitives ---------------- */
function sset(key, value, where = "session") {
  try {
    const store = where === "local" ? localStorage : sessionStorage;
    if (value === undefined || value === null) store.removeItem(key);
    else store.setItem(key, JSON.stringify(value));
  } catch {/* ignore */}
}

function sget(key, where = "session") {
  try {
    const store = where === "local" ? localStorage : sessionStorage;
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* -------------- tiny validators (non-strict) -------------- */
function isObj(v) { return v && typeof v === "object"; }
function looksLikeDraft(v) {
  if (!isObj(v)) return false;
  // minimally expect serviceType + from + to
  if (!v.serviceType || !v.from || !v.to) return false;
  if (v.serviceType === "parcel" && !isObj(v.parcel)) return false;
  if (v.serviceType === "freight" && !isObj(v.freight)) return false;
  return true;
}
function looksLikeReceipt(v) {
  if (!isObj(v)) return false;
  // minimally expect totals + quote or shipment identifiers
  if (!isObj(v.totals) && !isObj(v.quote) && !v.trackingId && !v.shipmentId) return false;
  return true;
}

/* -------------- migration helpers (once per get) ---------- */
function migrateGet({ current, legacy }, where, validator) {
  // Try current first
  const cur = sget(current, where);
  if (validator(cur)) return cur;

  // If empty/invalid, try to migrate from legacy keys (first valid wins)
  for (const k of legacy || []) {
    const val = sget(k, where);
    if (validator(val)) {
      // Save under current and remove legacy
      sset(current, val, where);
      try {
        const store = where === "local" ? localStorage : sessionStorage;
        store.removeItem(k);
      } catch {/* ignore */}
      return val;
    }
  }
  return null;
}

/* ------------------- DRAFT (session) ---------------------- */
export function saveDraft(draft) {
  // Accept anything; consumers may still build gradually in steps.
  sset(KEYS.draft.current, draft, "session");
}

export function getDraft() {
  // Attempt migration and return null if no valid draft present
  const v = migrateGet(KEYS.draft, "session", (x) => isObj(x));
  return v || null;
}

// Update draft with a partial object OR with a function(draft)=>newDraft
export function updateDraft(patch) {
  const cur = getDraft() || {};
  const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
  saveDraft(next);
  return next;
}

export function clearDraft() {
  sset(KEYS.draft.current, null, "session");
}

// ✅ Compatibility alias (some pages may import loadDraft)
export const loadDraft = getDraft;

/* ------------------ RECEIPT (local) ----------------------- */
export function saveReceipt(receipt) {
  sset(KEYS.receipt.current, receipt, "local");
}

export function getReceipt() {
  // Try to migrate and lightly validate
  const v = migrateGet(KEYS.receipt, "local", (x) => isObj(x));
  return v || null;
}

export function clearReceipt() {
  sset(KEYS.receipt.current, null, "local");
}

// ✅ Compatibility alias
export const loadReceipt = getReceipt;

/* ------------------- Convenience -------------------------- */
// Return both objects at once (helpful for debugging)
export function getStoredState() {
  return {
    draft: getDraft(),
    receipt: getReceipt(),
  };
}

// Hard reset (clear both)
export function clearAllStorage() {
  clearDraft();
  clearReceipt();
}
