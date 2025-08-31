// src/pages/admin/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuth, setAdminToken } from "../../utils/api";


const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Login failed");
      }

      // Expecting { message, token, admin: { ... } }
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminProfile", JSON.stringify(data.admin));
      navigate("/admin/dashboard", { replace: true });
    } catch (e) {
      setErr(e.message);
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

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="block text-sm text-gray-600">Email</span>
            <input
              type="email"
              required
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
                {showPwd ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a20.29 20.29 0 0 1 5.06-5.94m3.12-1.39A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a20.29 20.29 0 0 1-3.1 4.11" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {err}
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
          Tip: Set <code className="px-1 rounded bg-gray-100">VITE_API_BASE</code> in your <code>.env</code> if your API isn’t on the default
          <code className="px-1 rounded bg-gray-100"> http://127.0.0.1:4000/api</code>.
        </p>
      </div>
    </div>
  );
}
