// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuth, adminShipments, adminUsers, getAdminToken } from "../../utils/api";

export default function AdminDashboardSafe() {
  const navigate = useNavigate();

  const [diag, setDiag] = useState([]);
  const [meStatus, setMeStatus] = useState(null);
  const [shipsStatus, setShipsStatus] = useState(null);
  const [usersStatus, setUsersStatus] = useState(null);
  const [ships, setShips] = useState([]);
  const [users, setUsers] = useState([]);
  const [ready, setReady] = useState(false);

  function log(line) {
    setDiag(d => [...d, line]);
    console.log("[ADMIN SAFE]", line);
  }

  useEffect(() => {
    const t = getAdminToken();
    if (!t) {
      log("No token in storage → redirecting to /admin/login");
      navigate("/admin/login", { replace: true });
      return;
    }
    log("Token present; calling /api/admin/auth/me …");
    adminAuth.me()
      .then((me) => {
        setMeStatus(200);
        log("ME 200 ✅");
        setReady(true);
      })
      .catch((e) => {
        setMeStatus(e?.status ?? -1);
        log(`ME failed ❌: ${e?.status || "no-status"} ${e?.message || ""}`);
        navigate("/admin/login", { replace: true });
      });
  }, [navigate]);

  async function loadShipmentsNow() {
    try {
      log("Loading /api/admin/shipments?flat=1 …");
      const rows = await adminShipments.list({ flat: 1 });
      setShipsStatus(200);
      setShips(rows || []);
      log(`Shipments 200 ✅ (${(rows||[]).length} items)`);
    } catch (e) {
      setShipsStatus(e?.status ?? -1);
      log(`Shipments failed ❌: ${e?.status || "no-status"} ${e?.message || ""}`);
    }
  }
  async function loadUsersNow() {
    try {
      log("Loading /api/admin/users …");
      const list = await adminUsers.list();
      setUsersStatus(200);
      setUsers(list || []);
      log(`Users 200 ✅ (${(list||[]).length} items)`);
    } catch (e) {
      setUsersStatus(e?.status ?? -1);
      log(`Users failed ❌: ${e?.status || "no-status"} ${e?.message || ""}`);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md text-sm text-gray-700">
          <div className="font-semibold mb-2">Checking admin session…</div>
          <pre className="bg-gray-50 border rounded p-3 whitespace-pre-wrap">{diag.join("\n") || "…"}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard (Safe Mode)</h1>

      <div className="rounded-xl border p-4 bg-white">
        <div className="font-medium mb-2">Diagnostics</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div>ME: <b>{meStatus ?? "-"}</b></div>
          <div>Shipments: <b>{shipsStatus ?? "-"}</b></div>
          <div>Users: <b>{usersStatus ?? "-"}</b></div>
        </div>
        <pre className="mt-3 bg-gray-50 border rounded p-3 text-xs whitespace-pre-wrap max-h-48 overflow-auto">
{diag.join("\n") || "No logs yet"}
        </pre>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-1.5 rounded bg-red-600 text-white" onClick={loadShipmentsNow}>Load Shipments</button>
          <button className="px-3 py-1.5 rounded bg-gray-800 text-white" onClick={loadUsersNow}>Load Users</button>
        </div>
      </div>

      <div className="rounded-xl border p-4 bg-white">
        <div className="font-medium mb-2">Shipments ({ships.length})</div>
        <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto max-h-64">
{JSON.stringify(ships, null, 2)}
        </pre>
      </div>

      <div className="rounded-xl border p-4 bg-white">
        <div className="font-medium mb-2">Users ({users.length})</div>
        <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto max-h-64">
{JSON.stringify(users, null, 2)}
        </pre>
      </div>
    </div>
  );
}
