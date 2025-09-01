// src/pages/admin/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuth, setAdminToken, getApiBase } from "../../utils/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [diag, setDiag] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setDiag("");
    setLoading(true);

    const apiBase = getApiBase();
    const startedAt = Date.now();

    try {
      const data = await adminAuth.login(
        { email: form.email.trim(), password: form.password },
        { timeoutMs: 15000, retryOnNetworkError: true }
      );

      if (!data?.token) throw new Error("Missing token in response");

      setAdminToken(data.token);
      if (data?.admin) {
        localStorage.setItem("adminProfile", JSON.stringify(data.admin));
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (e) {
      // Show a helpful message + diagnostics
      const dur = Date.now() - startedAt;
      const message =
        e?.friendly ||
        e?.serverMessage ||
        e?.message ||
        "Login failed. Check API base, CORS, or network.";
      setErr(message);
      setDiag(
        [
          `API: ${apiBase}`,
          `Time: ${new Date().toISOString()}`,
          `Elapsed: ${dur}ms`,
          e?.status ? `HTTP ${e.status}` : "No HTTP status (network/CORS/timeout?)",
          e?.details ? `Details: ${e.details}` : "",
        ]
          .filter(Boolean)
          .join(" • ")
      );
      // Also log full error for DevTools
      console.error("[AdminLogin] login error", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">GlobalEdge Internal Access</p>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
          <label className="block">
            <span className="block text-sm text-gray-600">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30"
              placeholder="admin@test.com"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-gray-600">Password</span>
            <div className="mt-1 relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-red-500/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {/* eye icon omitted for brevity */}
                👁️
              </button>
            </div>
          </label>

          {err && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {err}
              {diag && <div className="mt-1 text-xs text-red-600">{diag}</div>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-2 w-full rounded-lg px-4 py-2 font-semibold text-white active:scale-[0.98] ${
              loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          Using <code className="px-1 rounded bg-gray-100">/api</code> unless{" "}
          <code className="px-1 rounded bg-gray-100">VITE_API_BASE</code> or{" "}
          <code className="px-1 rounded bg-gray-100">window.__API_BASE__</code> is set.
        </p>
      </div>
    </div>
  );
}
