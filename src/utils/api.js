// /src/utils/api.js

// ---------- Base URL ----------
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "/api"; // <- was "http://127.0.0.1:4000/api"
export function getApiBase() { return API_BASE; }             // <-- add
if (typeof window !== "undefined") window.__GE_API_BASE__ = API_BASE; // <-- add
  
// ---------- Token storage (simple localStorage helpers) ----------
const USER_TOKEN_KEY = "ge_user_token";
const ADMIN_TOKEN_KEY = "ge_admin_token";

export function getUserToken() {
  try {
    return localStorage.getItem(USER_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}
export function setUserToken(token) {
  try {
    token
      ? localStorage.setItem(USER_TOKEN_KEY, token)
      : localStorage.removeItem(USER_TOKEN_KEY);
  } catch {}
}
export function clearUserToken() {
  setUserToken(null);
}

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}
export function setAdminToken(token) {
  try {
    token
      ? localStorage.setItem(ADMIN_TOKEN_KEY, token)
      : localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}
export function clearAdminToken() {
  setAdminToken(null);
}

// ---- Back-compat aliases so existing code like getAuthToken() keeps working ----
export const getAuthToken = getUserToken;
export const setAuthToken = setUserToken;
export const clearAuthToken = clearUserToken;

// ---------- Core request helper ----------
function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(
  path,
  { method = "GET", body, headers = {}, token, signal } = {}
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "" };
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) || res.statusText || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function withQuery(path, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

// ---------- Public / User Auth ----------
export const auth = {
  register({ name, email, password }) {
    return request("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
  },
  verifyOtp({ email, otp, code }) {
    const theOtp = otp || code;
    return request("/auth/verify-otp", {
      method: "POST",
      body: { email, otp: theOtp },
    });
  },
  resendOtp({ email }) {
    return request("/auth/resend-otp", { method: "POST", body: { email } });
  },
  login({ email, password }) {
    return request("/auth/login", { method: "POST", body: { email, password } });
  },
  me(token = getUserToken()) {
    return request("/auth/me", { token });
  },
  logout(token = getUserToken()) {
    return request("/auth/logout", { method: "POST", token });
  },
};

// ---------- Shipments ----------
/**
 * Routes available:
 *   POST /api/shipments/quote          (no auth)
 *   POST /api/shipments/public         (guest booking, no auth)
 *   GET  /api/shipments                (auth)
 *   GET  /api/shipments/:id            (auth)
 *   GET  /api/shipments/track/:id      (no auth)
 */
export const shipments = {
  // Quote (no auth)
  quote({ origin, destination, parcel, parcels, serviceLevel = "standard" }) {
    const body = {
      origin: origin ?? "",
      destination: destination ?? "",
      serviceLevel,
      parcels: parcels ?? (parcel ? [parcel] : []),
    };
    return request("/shipments/quote", { method: "POST", body });
  },

  // Create shipment (calls public guest endpoint — no token)
  create(payload) {
    return request("/shipments/public", { method: "POST", body: payload });
  },

  // List my shipments (requires auth)
  listMine(token = getUserToken()) {
    return request("/shipments", { token });
  },

  // Get one of my shipments (requires auth)
  getOne(id, token = getUserToken()) {
    return request(`/shipments/${id}`, { token });
  },

  // Public tracking (no auth)
  track(trackingNumber) {
    return request(`/shipments/track/${encodeURIComponent(trackingNumber)}`);
  },
};

// ---------- Admin Auth ----------
export const adminAuth = {
  register({ name, email, password, inviteCode }) {
    return request("/admin/auth/register", {
      method: "POST",
      body: { name, email, password, inviteCode },
    });
  },
  login({ email, password }) {
    return request("/admin/auth/login", { method: "POST", body: { email, password } });
  },
  me(token = getAdminToken()) {
    return request("/admin/auth/me", { token });
  },
  logout(token = getAdminToken()) {
    return request("/admin/auth/logout", { method: "POST", token });
  },
};

// ---------- Admin: Shipments ----------
export const adminShipments = {
  list(params = {}, token = getAdminToken()) {
    return request(withQuery("/admin/shipments", params), { token });
  },
  getOne(id, token = getAdminToken()) {
    return request(`/admin/shipments/${id}`, { token });
  },
  update(id, patch, token = getAdminToken()) {
    return request(`/admin/shipments/${id}`, {
      method: "PATCH",
      body: patch,
      token,
    });
  },
  notify(id, token = getAdminToken()) {
    return request(`/admin/shipments/${id}/notify`, { method: "POST", token });
  },
  // ADD: create a shipment (used by Admin Add Shipment modal)
  create(body, token = getAdminToken()) {
    return request(`/admin/shipments`, { method: "POST", body, token });
  },
};

// ---------- Admin: Users ----------
export const adminUsers = {
  list(params = {}, token = getAdminToken()) {
    return request(withQuery("/admin/users", params), { token });
  },
  getOne(id, token = getAdminToken()) {
    return request(`/admin/users/${id}`, { token });
  },
  update(id, patch, token = getAdminToken()) {
    return request(`/admin/users/${id}`, {
      method: "PATCH",
      body: patch,
      token,
    });
  },

  // ✅ NEW: fetch full UserDetails doc for a user
  getDetails(userId, token = getAdminToken()) {
    return request(`/admin/users/${encodeURIComponent(userId)}/details`, { token });
  },

  // ✅ NEW: replace/save full UserDetails doc for a user
  // pass { recompute: 1|0 } to control server-side billing recompute
  setDetails(userId, body, { recompute = 1 } = {}, token = getAdminToken()) {
    const path = withQuery(`/admin/users/${encodeURIComponent(userId)}/details`, {
      recompute,
    });
    return request(path, { method: "PUT", body, token });
  },

  remove(id, token = getAdminToken()) {
    return request(`/admin/users/${id}`, { method: "DELETE", token });
  },
};

// ---------- Admin: Mock overlay (inject / clear / get) ----------
export const adminMock = {
  // GET the current overlay bundle for a user
  get(userId, token = getAdminToken()) {
    return request(`/admin/mock/${encodeURIComponent(userId)}`, { token });
  },
  // POST: inject/merge overlay
  inject(userId, body, token = getAdminToken()) {
    return request(`/admin/mock/${encodeURIComponent(userId)}`, {
      method: "POST",
      body,
      token,
    });
  },
  // DELETE: clear overlay
  clear(userId, token = getAdminToken()) {
    return request(`/admin/mock/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      token,
    });
  },
};

// ---------- Lightweight direct helpers ----------
export async function apiGet(path, token) {
  return request(path, { token });
}
export async function apiPost(path, body, token) {
  return request(path, { method: "POST", body, token });
}
export async function apiPatch(path, body, token) {
  return request(path, { method: "PATCH", body, token });
}
// ✅ NEW: PUT helper (used by setDetails)
export async function apiPut(path, body, token) {
  return request(path, { method: "PUT", body, token });
}

// ---------- Admin: Email ----------
export const adminEmail = {
  send({ to, subject, body }, token = getAdminToken()) {
    // backend expects html or text; we’ll send html.
    return request("/email/send", {
      method: "POST",
      body: { to, subject, html: body },
      token,
    });
  },
};

// ---------- Book from draft (helper) ----------
export async function bookFromDraft(draft) {
  return shipments.create(draft);
}

// ---- Back-compat module aliases ----
export const AuthAPI = auth;
export const ShipAPI = shipments;
