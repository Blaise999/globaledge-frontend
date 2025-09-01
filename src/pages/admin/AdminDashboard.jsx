// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/globaledge.png";
import { adminShipments as AdminAPI, adminUsers, adminEmail, adminMock } from "../../utils/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authErr, setAuthErr] = useState("");
}

  useEffect(() => {
    const t = getAdminToken();
    console.log("[AdminDashboard] token prefix:", (t||"").slice(0,20));
    if (!t) {
      setAuthErr("No admin token found (storage).");
      navigate("/admin/login", { replace: true });
      return;
    }
    adminAuth.me()
      .then(() => {
        console.log("[AdminDashboard] /admin/auth/me: 200");
        setReady(true);
      })
      .catch((e) => {
        console.error("[AdminDashboard] /admin/auth/me failed", e?.status, e);
        setAuthErr(`Auth check failed: ${e?.status ?? "no-status"} ${e?.message ?? ""}`);
        navigate("/admin/login", { replace: true });
      });
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center">
          <div className="text-sm text-gray-500">Checking admin session…</div>
          {authErr && <div className="mt-2 text-xs text-red-600">{authErr}</div>}
        </div>
      </div>
    );
  }
// --- mapper: API Shipment -> Admin row shape the table expects
function mapDocToRow(s) {
  const service = s.serviceType
    ? s.serviceType === "freight"
      ? "Freight"
      : s.parcel?.level
      ? s.parcel.level[0].toUpperCase() + s.parcel.level.slice(1)
      : "Standard"
    : "Standard";
  const weight = Number(s.parcel?.weight || s.freight?.weight || 0);
  const pieces = s.parcel ? 1 : s.freight?.pallets || 1;
  return {
    id: s._id,
    date: s.createdAt || new Date().toISOString(),
    tracking: s.trackingNumber || "—",
    service,
    status: s.status || "Created",
    from: s.from || "—",
    to: s.to || "—",
    toName: s.to?.split(",")[0] || "",
    recipientEmail: s.recipientEmail || "",
    pieces,
    weight,
    cost: Number(s.price || 0),
    eta: s.eta || "",
    events: Array.isArray(s.timeline)
      ? s.timeline
          .map((ev) => ({
            title: ev.status || "Update",
            location: ev.note || "",
            code: ev.status || "",
            ts: ev.at || s.updatedAt || s.createdAt,
          }))
          .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      : [],
    current: {
      city: (s.lastLocation || "").split(",")[0] || "",
      country: (s.lastLocation || "").split(",").slice(1).join(",").trim() || "",
      lat: 0,
      lon: 0,
    },
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const TABS = ["Shipments", "Users", "Emails", "Settings"];
  const [tab, setTab] = useState("Shipments");

  // ===== live data =====
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState("");

  // Users (API-backed)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersErr, setUsersErr] = useState("");

  // Emails/Settings (demo)
  const [emailOutbox, setEmailOutbox] = useState([]);
  const [settings, setSettings] = useState({
    pickupWindows: ["09:00–13:00", "13:00–17:00", "17:00–20:00"],
    defaultIncoterm: "DAP",
    emailFrom: "ops@globaledge.example",
    smsEnabled: false,
  });

  // ===== fetch shipments from API =====
  const loadShipments = useCallback(async () => {
    setLoading(true);
    setLoadErr("");
    try {
      const rows = await AdminAPI.list({ flat: 1 });
      setShipments((rows || []).map(mapDocToRow));
    } catch (e) {
      const msg = e?.data?.message || e?.message || "Failed to load shipments";
      setLoadErr(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // ===== fetch users from API =====
  function mapUser(u) {
    const hasFirst = !!u.firstName || !!u.lastName;
    const [first, ...rest] = String(u.name || "").trim().split(" ");
    const fallbackFirst = first || "";
    const fallbackLast = rest.join(" ") || "";
    return {
      id: u._id || u.id,
      email: u.email || "",
      role: u.role || "user",
      firstName: hasFirst ? (u.firstName || "") : fallbackFirst,
      lastName: hasFirst ? (u.lastName || "") : fallbackLast,
      company: u.company || "",
      phone: u.phone || "",
      address: u.address || "",
      shipmentsCount: u.shipmentsCount || 0,
      totalSpend: u.totalSpend || 0,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    };
  }

  async function loadUsers() {
    setUsersLoading(true);
    setUsersErr("");
    try {
      const list = await adminUsers.list(); // GET /api/admin/users
      setUsers((list || []).map(mapUser));
    } catch (e) {
      setUsersErr(e?.data?.message || e?.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // ===== Shipments filters =====
  const [q, setQ] = useState("");
  const [fService, setFService] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (fService !== "all" && s.service !== fService) return false;
      if (fStatus !== "all" && s.status !== fStatus) return false;
      if (q) {
        const t = q.toLowerCase();
        const blob = `${s.tracking} ${s.to} ${s.toName} ${s.from} ${s.service} ${s.recipientEmail}`.toLowerCase();
        if (!blob.includes(t)) return false;
      }
      return true;
    });
  }, [shipments, fService, fStatus, q]);

  // ===== Modals & forms =====
  const [editShipOpen, setEditShipOpen] = useState(false);
  const [editShip, setEditShip] = useState(null);

  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", location: "", code: "", ts: "" });

  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "GlobalEdge shipment update",
    body: "Hello,\n\nHere is an update regarding your shipment.\n\nRegards,\nGlobalEdge",
  });

  // NEW — Inject Fake Data (per user)
  const [injectOpen, setInjectOpen] = useState(false);
  const [injectUser, setInjectUser] = useState(null);
  const [injectForm, setInjectForm] = useState({
    shipments: 10,
    addresses: 2,
    packages: 2,
    payments: 1,
    pickups: 1,
    notes: "",
  });

  // NEW — Add Shipment (per user)
  const [newShipOpen, setNewShipOpen] = useState(false);
  const [newShip, setNewShip] = useState({
    userId: "",
    tracking: "",
    service: "Standard",
    status: "Created",
    from: "",
    to: "",
    toName: "",
    recipientEmail: "",
    pieces: 1,
    weight: 1,
    cost: 0,
    eta: "",
  });

  // ===== Actions: Shipments =====
  function openEditShipment(s) {
    setEditShip({ ...s });
    setEditShipOpen(true);
  }

  async function saveShipment(e) {
    e.preventDefault();
    try {
      const patch = {};
      if (editShip.status) patch.status = editShip.status;
      const loc = [editShip.current?.city, editShip.current?.country].filter(Boolean).join(", ");
      if (loc) patch.lastLocation = loc;
      if (editShip.eta) patch.eta = editShip.eta; // persist ETA

      if (Object.keys(patch).length) {
        await AdminAPI.update(editShip.id, patch);
      }
      setShipments((arr) => arr.map((s) => (s.tracking === editShip.tracking ? cleanShip(editShip) : s)));
      setEditShipOpen(false);
      toast(`Shipment ${editShip.tracking} updated`);
      loadShipments();
    } catch (err) {
      toast(err?.data?.message || err?.message || "Failed to update shipment");
    }
  }

  function cleanShip(s) {
    return {
      ...s,
      cost: Number(s.cost) || 0,
      weight: Number(s.weight) || 0,
      pieces: Number(s.pieces) || 1,
      events: Array.isArray(s.events) ? s.events : [],
      current: s.current || { city: "", country: "", lat: 0, lon: 0 },
    };
  }

  function deleteShipment(tracking) {
    if (!confirm(`Delete shipment ${tracking}?`)) return;
    setShipments((arr) => arr.filter((s) => s.tracking !== tracking));
    toast(`Shipment ${tracking} deleted (UI only)`);
  }

  // Timeline events (UI-only demo)
  function openAddEvent(s) {
    setEditShip({ ...s });
    setEventForm({
      title: "",
      location: "",
      code: "",
      ts: new Date().toISOString(),
    });
    setEventOpen(true);
  }
  function addEvent(e) {
    e.preventDefault();
    const copy = { ...editShip };
    copy.events = [{ ...eventForm }, ...copy.events];
    if (eventForm.title.toLowerCase().includes("out for delivery")) copy.status = "Out for Delivery";
    else if (eventForm.title.toLowerCase().includes("delivered")) copy.status = "Delivered";
    else if (eventForm.title.toLowerCase().includes("exception")) copy.status = "Exception";
    setShipments((arr) => arr.map((s) => (s.tracking === copy.tracking ? copy : s)));
    setEventOpen(false);
    toast("Event added (UI)");
  }
  function removeEvent(s, idx) {
    const copy = { ...s, events: s.events.filter((_, i) => i !== idx) };
    setShipments((arr) => arr.map((x) => (x.tracking === s.tracking ? copy : x)));
  }

  // ===== Actions: Users =====
  function openEditUser(u) {
    setEditUser({ ...u });
    setEditUserOpen(true);
  }

  function saveUser(e) {
    e.preventDefault();
    (async () => {
      try {
        const patch = {
          name: `${editUser.firstName || ""} ${editUser.lastName || ""}`.trim(),
          email: editUser.email,
          role: editUser.role,
          company: editUser.company,
          phone: editUser.phone,
          address: editUser.address,
          // keep backend-editable aggregates:
          shipmentsCount: Number(editUser.shipmentsCount || 0),
          totalSpend: Number(editUser.totalSpend || 0),
        };
        await adminUsers.update(editUser.id, patch); // PATCH /api/admin/users/:id
        await loadUsers();
        setEditUserOpen(false);
        toast(`User ${editUser.email} updated`);
      } catch (err) {
        toast(err?.data?.message || err?.message || "Update failed");
      }
    })();
  }

  // NEW — Inject fake data (overlay) for a specific user
  function openInject(u) {
    setInjectUser(u);
    setInjectForm({
      shipments: 10,
      addresses: 2,
      packages: 2,
      payments: 1,
      pickups: 1,
      notes: "",
    });
    setInjectOpen(true);
  }
  async function submitInject(e) {
    e.preventDefault();
    try {
      await adminMock.inject(injectUser.id, { ...injectForm });
      setInjectOpen(false);
      toast("Fake data injected");
      // optionally refresh shipments/users
      await loadShipments();
      await loadUsers();
    } catch (err) {
      toast(err?.data?.message || err?.message || "Failed to inject");
    }
  }

  // NEW — Add a real shipment to user's catalogue
  function openNewShipmentForUser(u) {
    setNewShip({
      userId: u.id,
      tracking: "",
      service: "Standard",
      status: "Created",
      from: "",
      to: "",
      toName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      recipientEmail: u.email || "",
      pieces: 1,
      weight: 1,
      cost: 0,
      eta: "",
    });
    setNewShipOpen(true);
  }
  async function saveNewShipment(e) {
    e.preventDefault();
    try {
      const payload = {
        userId: newShip.userId,
        trackingNumber: (newShip.tracking || "").trim(),
        serviceType: newShip.service.toLowerCase() === "freight" ? "freight" : "parcel",
        parcel: newShip.service.toLowerCase() === "freight" ? undefined : {
          level: newShip.service.toLowerCase(), // "standard", "express", ...
          weight: Number(newShip.weight || 0),
        },
        freight: newShip.service.toLowerCase() !== "freight" ? undefined : {
          pallets: Number(newShip.pieces || 1),
          weight: Number(newShip.weight || 0),
        },
        status: newShip.status,
        from: newShip.from,
        to: newShip.to,
        recipientEmail: newShip.recipientEmail,
        price: Number(newShip.cost || 0),
        eta: newShip.eta || undefined,
      };
      await AdminAPI.create(payload); // POST /api/admin/shipments
      setNewShipOpen(false);
      toast("Shipment added");
      await loadShipments();
    } catch (err) {
      toast(err?.data?.message || err?.message || "Failed to add shipment");
    }
  }

  // ======== USERS: UserDetails JSON editor (Mongo-Compass-like) ========
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);
  const [detailsJSON, setDetailsJSON] = useState("{\n}");
  const [detailsErr, setDetailsErr] = useState("");
  const [recomputeOnSave, setRecomputeOnSave] = useState(true);

  async function openDetails(u) {
    setDetailsUser(u);
    setDetailsErr("");
    try {
      // GET /api/admin/users/:id/details
      const doc = await adminUsers.getDetails(u.id);
      setDetailsJSON(JSON.stringify(doc || {}, null, 2));
      setDetailsOpen(true);
    } catch (e) {
      toast(e?.data?.message || e?.message || "Failed to load details");
    }
  }

  function prettyDetails() {
    try {
      const obj = JSON.parse(detailsJSON);
      setDetailsJSON(JSON.stringify(obj, null, 2));
      setDetailsErr("");
    } catch (e) {
      setDetailsErr(String(e.message || e));
    }
  }

  async function saveDetails(e) {
    e.preventDefault();
    try {
      const body = JSON.parse(detailsJSON);
      // PUT /api/admin/users/:id/details?recompute=0|1
      await adminUsers.setDetails(detailsUser.id, body, { recompute: recomputeOnSave ? 1 : 0 });
      setDetailsOpen(false);
      toast("UserDetails saved");
      await loadUsers(); // refresh aggregates if exposed on users list
    } catch (e) {
      setDetailsErr(e?.data?.message || e?.message || "Failed to save details");
    }
  }
  // ===================== end Users JSON editor additions =====================

  // ===== Emails (demo) =====
  function openEmailTo(s) {
    setEmailForm({
      to: s.recipientEmail || "",
      subject: `Update on ${s.tracking}`,
      body: `Hello ${s.toName || ""},\n\nWe have an update regarding your shipment ${s.tracking}.\n\nStatus: ${s.status}\nRoute: ${s.from} → ${s.to}\n\nRegards,\nGlobalEdge`,
    });
    setEmailOpen(true);
  }
  async function sendEmail(e) {
    e.preventDefault();
    try {
      await adminEmail.send({
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
      });
      setEmailOpen(false);
      toast("Email sent");
    } catch (err) {
      toast(err?.data?.message || err?.message || "Failed to send email");
    }
  }

  // ===== Settings (demo) =====
  function saveSettings(e) {
    e.preventDefault();
    toast("Settings saved (demo)");
  }

  // ===== UI =====
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_120%_-10%,#fef2f2,transparent)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-2">
              <Tag color="red">Admin</Tag>
              <button className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50" onClick={loadShipments}>
                Reload
              </button>
              <Link
                to="/services/express?type=parcel#quote"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98]"
              >
                Create Shipment
              </Link>
              <Link to="/dashboard" className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">
                Customer View
              </Link>
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
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Shipments */}
        {tab === "Shipments" && (
          <section>
            <SectionHeader title="Manage Shipments" />
            <div className="grid md:grid-cols-5 gap-3">
              <Input
                label="Search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tracking, recipient, email, destination…"
              />
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
                  { v: "Picked Up", t: "Picked Up" },
                  { v: "In Transit", t: "In Transit" },
                  { v: "Out for Delivery", t: "Out for Delivery" },
                  { v: "Delivered", t: "Delivered" },
                  { v: "Exception", t: "Exception" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-secondary" onClick={() => exportCSV(filteredShipments)}>
                  Export CSV
                </button>
                <button className="btn-secondary" onClick={() => toast("Bulk upload (todo)")}>
                  Bulk upload
                </button>
              </div>
              <div className="flex items-end">
                {loading && <span className="text-sm text-gray-500">Loading…</span>}
                {loadErr && <span className="text-sm text-red-600">{loadErr}</span>}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <Th>Date</Th>
                    <Th>Tracking</Th>
                    <Th>Service</Th>
                    <Th>Status</Th>
                    <Th>Recipient</Th>
                    <Th>Email</Th>
                    <Th>Cost</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredShipments.map((s) => (
                    <Tr key={s.id || s.tracking}>
                      <Td>{fmtDate(s.date)}</Td>
                      <Td>
                        <div className="font-medium">{s.tracking}</div>
                        <div className="text-xs text-gray-500">
                          {s.from} → {s.to}
                        </div>
                      </Td>
                      <Td>
                        <Tag color="red">{s.service}</Tag>
                      </Td>
                      <Td>
                        <StatusBadge status={s.status} />
                      </Td>
                      <Td>
                        <div className="font-medium">{s.toName || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {s.pieces} pc • {s.weight} kg
                        </div>
                      </Td>
                      <Td className="text-xs">{s.recipientEmail || "—"}</Td>
                      <Td>€{formatMoney(s.cost)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-ghost" onClick={() => openEditShipment(s)}>
                            <EditIcon /> Edit
                          </button>
                          <button className="btn-ghost" onClick={() => openAddEvent(s)}>
                            <PlusIcon /> Event
                          </button>
                          <button className="btn-ghost" onClick={() => openEmailTo(s)}>
                            <MailIcon /> Email
                          </button>
                          <button className="btn-ghost text-red-600" onClick={() => deleteShipment(s.tracking)}>
                            <TrashIcon /> Delete
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                  {filteredShipments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                        {loading ? "Loading…" : "No shipments match your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Users */}
        {tab === "Users" && (
          <section>
            <SectionHeader
              title="Manage Users"
              action={
                <button className="btn-secondary" onClick={loadUsers}>
                  Reload
                </button>
              }
            />
            {usersLoading && <div className="text-sm text-gray-500 mb-2">Loading users…</div>}
            {usersErr && <div className="text-sm text-red-600 mb-2">{usersErr}</div>}

            <div className="rounded-2xl border bg-white overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Created</Th>
                    <Th>Last Login</Th>
                    <Th>Shipments</Th>
                    <Th>Spend</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <Tr key={u.id}>
                      <Td>
                        <div className="font-medium">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{u.company || "—"}</div>
                      </Td>
                      <Td>{u.email}</Td>
                      <Td>
                        <Tag color={u.role === "admin" ? "red" : "slate"}>{u.role}</Tag>
                      </Td>
                      <Td>{fmtDate(u.createdAt)}</Td>
                      <Td>{fmtDate(u.lastLogin)}</Td>
                      <Td>{u.shipmentsCount}</Td>
                      <Td>€{formatMoney(u.totalSpend)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <button className="btn-ghost" onClick={() => openEditUser(u)}>
                            <EditIcon /> Edit
                          </button>

                          {/* NEW: Details JSON editor for UserDetails */}
                          <button className="btn-ghost" onClick={() => openDetails(u)}>
                            <EditIcon /> Details
                          </button>

                          {/* NEW: Inject fake overlay data for this user */}
                          <button className="btn-ghost" onClick={() => openInject(u)}>
                            <PlusIcon /> Inject fake
                          </button>

                          {/* NEW: Add a shipment linked to this user */}
                          <button className="btn-ghost" onClick={() => openNewShipmentForUser(u)}>
                            <PlusIcon /> Add shipment
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                  {users.length === 0 && !usersLoading && !usersErr && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Emails (demo) */}
        {tab === "Emails" && (
          <section>
            <SectionHeader title="Email Outbox (demo)" />
            <div className="rounded-2xl border bg-white overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Time</Th>
                    <Th>From</Th>
                    <Th>To</Th>
                    <Th>Subject</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {emailOutbox.map((m) => (
                    <Tr key={m.id}>
                      <Td>{new Date(m.ts).toLocaleString()}</Td>
                      <Td>{m.from}</Td>
                      <Td>{m.to}</Td>
                      <Td>{m.subject}</Td>
                    </Tr>
                  ))}
                  {emailOutbox.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                        No emails yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Settings (demo) */}
        {tab === "Settings" && (
          <section>
            <SectionHeader title="Operations Settings" />
            <form className="grid md:grid-cols-2 gap-4" onSubmit={saveSettings}>
              <Input
                label="Default Incoterm"
                value={settings.defaultIncoterm}
                onChange={(e) => setSettings((s) => ({ ...s, defaultIncoterm: e.target.value }))}
              />
              <Input
                label="Email From"
                value={settings.emailFrom}
                onChange={(e) => setSettings((s) => ({ ...s, emailFrom: e.target.value }))}
              />
              <Textarea
                label="Pickup windows (comma separated)"
                value={settings.pickupWindows.join(", ")}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    pickupWindows: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }))
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.smsEnabled}
                  onChange={(e) => setSettings((s) => ({ ...s, smsEnabled: e.target.checked }))}
                />
                Enable SMS (demo)
              </label>
              <div className="md:col-span-2">
                <button className="btn-primary">Save</button>
              </div>
            </form>
          </section>
        )}
      </main>

      {/* ===== Modals ===== */}
      {editShipOpen && editShip && (
        <Modal title={`Edit ${editShip.tracking}`} onClose={() => setEditShipOpen(false)}>
          <form className="grid sm:grid-cols-2 gap-3" onSubmit={saveShipment}>
            <Input
              label="Service"
              value={editShip.service}
              onChange={(e) => setEditShip({ ...editShip, service: e.target.value })}
            />
            <Select
              label="Status"
              value={editShip.status}
              onChange={(e) => setEditShip({ ...editShip, status: e.target.value })}
              options={["Created", "Picked Up", "In Transit", "Out for Delivery", "Delivered", "Exception"].map(
                (x) => ({ v: x, t: x })
              )}
            />
            <Input label="From" value={editShip.from} onChange={(e) => setEditShip({ ...editShip, from: e.target.value })} />
            <Input label="To" value={editShip.to} onChange={(e) => setEditShip({ ...editShip, to: e.target.value })} />
            <Input
              label="Recipient name"
              value={editShip.toName || ""}
              onChange={(e) => setEditShip({ ...editShip, toName: e.target.value })}
            />
            <Input
              label="Recipient email"
              type="email"
              value={editShip.recipientEmail || ""}
              onChange={(e) => setEditShip({ ...editShip, recipientEmail: e.target.value })}
            />
            <Input
              label="Pieces"
              type="number"
              value={editShip.pieces}
              onChange={(e) => setEditShip({ ...editShip, pieces: e.target.value })}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={editShip.weight}
              onChange={(e) => setEditShip({ ...editShip, weight: e.target.value })}
            />
            <Input
              label="Cost (EUR)"
              type="number"
              step="0.01"
              value={editShip.cost}
              onChange={(e) => setEditShip({ ...editShip, cost: e.target.value })}
            />

            {/* ETA editor (safe) */}
            <Input
              label="ETA (estimated delivery)"
              type="datetime-local"
              value={toLocalDT(editShip.eta)}
              onChange={(e) => setEditShip({ ...editShip, eta: fromLocalDT(e.target.value) })}
            />

            <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
              <Input
                label="Current city"
                value={editShip.current?.city || ""}
                onChange={(e) =>
                  setEditShip({ ...editShip, current: { ...(editShip.current || {}), city: e.target.value } })
                }
              />
              <Input
                label="Current country"
                value={editShip.current?.country || ""}
                onChange={(e) =>
                  setEditShip({ ...editShip, current: { ...(editShip.current || {}), country: e.target.value } })
                }
              />
            </div>
            <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
              <Input
                label="Current lat"
                type="number"
                step="0.0001"
                value={editShip.current?.lat ?? 0}
                onChange={(e) =>
                  setEditShip({
                    ...editShip,
                    current: { ...(editShip.current || {}), lat: parseFloat(e.target.value) },
                  })
                }
              />
              <Input
                label="Current lon"
                type="number"
                step="0.0001"
                value={editShip.current?.lon ?? 0}
                onChange={(e) =>
                  setEditShip({
                    ...editShip,
                    current: { ...(editShip.current || {}), lon: parseFloat(e.target.value) },
                  })
                }
              />
            </div>

            <div className="sm:col-span-2 mt-1">
              <div className="text-xs text-gray-600 mb-2">Timeline events</div>
              <ul className="space-y-2">
                {editShip.events?.map((ev, i) => (
                  <li key={i} className="flex items-center justify-between rounded border p-2">
                    <div className="text-xs">
                      <div className="font-medium">{ev.title}</div>
                      <div className="text-gray-500">
                        {ev.location} • {new Date(ev.ts).toLocaleString()} {ev.code && `• ${ev.code}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost text-red-600"
                      onClick={() => removeEvent(editShip, i)}
                    >
                      <TrashIcon /> Remove
                    </button>
                  </li>
                ))}
                {(!editShip.events || editShip.events.length === 0) && (
                  <li className="text-xs text-gray-500">No events yet.</li>
                )}
              </ul>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditShipOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {eventOpen && (
        <Modal title={`Add event — ${editShip?.tracking}`} onClose={() => setEventOpen(false)}>
          <form className="grid gap-3" onSubmit={addEvent}>
            <Input
              label="Title"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              placeholder="Arrived at sorting facility"
            />
            <Input
              label="Location"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              placeholder="Kano, NG"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Code (optional)"
                value={eventForm.code}
                onChange={(e) => setEventForm({ ...eventForm, code: e.target.value })}
                placeholder="ARR / DEP / OFD…"
              />
              <Input
                label="Timestamp"
                type="datetime-local"
                value={toLocalDT(eventForm.ts)}
                onChange={(e) => setEventForm({ ...eventForm, ts: fromLocalDT(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEventOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">Add</button>
            </div>
          </form>
        </Modal>
      )}

      {editUserOpen && editUser && (
        <Modal title={`Edit user — ${editUser.email}`} onClose={() => setEditUserOpen(false)}>
          <form className="grid sm:grid-cols-2 gap-3" onSubmit={saveUser}>
            <Input
              label="First name"
              value={editUser.firstName}
              onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
            />
            <Input
              label="Last name"
              value={editUser.lastName}
              onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={editUser.email}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
            />
            <Input
              label="Company"
              value={editUser.company || ""}
              onChange={(e) => setEditUser({ ...editUser, company: e.target.value })}
            />
            <Input
              label="Phone"
              value={editUser.phone || ""}
              onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
            />
            <Select
              label="Role"
              value={editUser.role}
              onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              options={["user", "admin"].map((x) => ({ v: x, t: x }))}
            />
            {/* These two satisfy: edit total user amount shipped/spend */}
            <Input
              label="Shipments count"
              type="number"
              value={editUser.shipmentsCount}
              onChange={(e) => setEditUser({ ...editUser, shipmentsCount: e.target.value })}
            />
            <Input
              label="Total spend (EUR)"
              type="number"
              step="0.01"
              value={editUser.totalSpend}
              onChange={(e) => setEditUser({ ...editUser, totalSpend: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Address"
                value={editUser.address || ""}
                onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditUserOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* NEW: Details JSON editor modal for UserDetails */}
      {detailsOpen && detailsUser && (
        <Modal title={`UserDetails — ${detailsUser.email}`} onClose={() => setDetailsOpen(false)}>
          <form className="grid gap-3" onSubmit={saveDetails}>
            <div className="text-xs text-gray-600">
              Full <code>UserDetails</code> JSON. Edit like Mongo Compass. Arrays/objects supported.
              <div className="mt-1">
                <span className="font-semibold">Hints:</span> keys include
                <code> shipments</code>,<code> addresses</code>,<code> paymentMethods</code>,<code> pickups</code>,<code> billing</code>,<code> adminOverlay</code>.
              </div>
            </div>

            {detailsErr && <div className="text-xs text-red-600">{detailsErr}</div>}

            <Textarea
              label="JSON"
              value={detailsJSON}
              onChange={(e) => setDetailsJSON(e.target.value)}
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              }}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={recomputeOnSave}
                  onChange={(e) => setRecomputeOnSave(e.target.checked)}
                />
                Recompute billing on save
              </label>

              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={prettyDetails}>
                  Pretty-print
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* NEW: Inject Fake Data modal */}
      {injectOpen && injectUser && (
        <Modal title={`Inject fake data — ${injectUser.email}`} onClose={() => setInjectOpen(false)}>
          <form className="grid sm:grid-cols-3 gap-3" onSubmit={submitInject}>
            <Input
              label="Shipments"
              type="number"
              value={injectForm.shipments}
              onChange={(e) => setInjectForm({ ...injectForm, shipments: Number(e.target.value) })}
            />
            <Input
              label="Addresses"
              type="number"
              value={injectForm.addresses}
              onChange={(e) => setInjectForm({ ...injectForm, addresses: Number(e.target.value) })}
            />
            <Input
              label="Packages"
              type="number"
              value={injectForm.packages}
              onChange={(e) => setInjectForm({ ...injectForm, packages: Number(e.target.value) })}
            />
            <Input
              label="Payments"
              type="number"
              value={injectForm.payments}
              onChange={(e) => setInjectForm({ ...injectForm, payments: Number(e.target.value) })}
            />
            <Input
              label="Pickups"
              type="number"
              value={injectForm.pickups}
              onChange={(e) => setInjectForm({ ...injectForm, pickups: Number(e.target.value) })}
            />
            <div className="sm:col-span-3">
              <Textarea
                label="Other random static (notes)"
                value={injectForm.notes}
                onChange={(e) => setInjectForm({ ...injectForm, notes: e.target.value })}
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setInjectOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">Inject</button>
            </div>
          </form>
        </Modal>
      )}

      {/* NEW: Add Shipment modal */}
      {newShipOpen && (
        <Modal title="Add shipment to user" onClose={() => setNewShipOpen(false)}>
          <form className="grid sm:grid-cols-2 gap-3" onSubmit={saveNewShipment}>
            <Select
              label="User"
              value={newShip.userId}
              onChange={(e) => setNewShip({ ...newShip, userId: e.target.value })}
              options={[
                { v: "", t: "Select user…" },
                ...users.map((u) => ({
                  v: u.id,
                  t: `${u.firstName || ""} ${u.lastName || ""} — ${u.email}`,
                })),
              ]}
            />
            <Input
              label="Tracking (optional)"
              value={newShip.tracking}
              onChange={(e) => setNewShip({ ...newShip, tracking: e.target.value })}
            />
            <Select
              label="Service"
              value={newShip.service}
              onChange={(e) => setNewShip({ ...newShip, service: e.target.value })}
              options={["Standard", "Express", "Priority", "Freight"].map((x) => ({ v: x, t: x }))}
            />
            <Select
              label="Status"
              value={newShip.status}
              onChange={(e) => setNewShip({ ...newShip, status: e.target.value })}
              options={["Created", "Picked Up", "In Transit", "Out for Delivery", "Delivered", "Exception"].map((x) => ({
                v: x,
                t: x,
              }))}
            />
            <Input label="From" value={newShip.from} onChange={(e) => setNewShip({ ...newShip, from: e.target.value })} />
            <Input label="To" value={newShip.to} onChange={(e) => setNewShip({ ...newShip, to: e.target.value })} />
            <Input label="Recipient name" value={newShip.toName} onChange={(e) => setNewShip({ ...newShip, toName: e.target.value })} />
            <Input
              label="Recipient email"
              type="email"
              value={newShip.recipientEmail}
              onChange={(e) => setNewShip({ ...newShip, recipientEmail: e.target.value })}
            />
            <Input
              label="Pieces"
              type="number"
              value={newShip.pieces}
              onChange={(e) => setNewShip({ ...newShip, pieces: Number(e.target.value) })}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={newShip.weight}
              onChange={(e) => setNewShip({ ...newShip, weight: Number(e.target.value) })}
            />
            <Input
              label="Cost (EUR)"
              type="number"
              step="0.01"
              value={newShip.cost}
              onChange={(e) => setNewShip({ ...newShip, cost: Number(e.target.value) })}
            />
            <Input
              label="ETA (optional)"
              type="datetime-local"
              value={toLocalDT(newShip.eta)}
              onChange={(e) => setNewShip({ ...newShip, eta: fromLocalDT(e.target.value) })}
            />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setNewShipOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">Add shipment</button>
            </div>
          </form>
        </Modal>
      )}

      {emailOpen && (
        <Modal title="Send email (demo)" onClose={() => setEmailOpen(false)}>
          <form className="grid gap-3" onSubmit={sendEmail}>
            <Input label="From" value={settings.emailFrom} readOnly />
            <Input
              label="To"
              type="email"
              required
              value={emailForm.to}
              onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
            />
            <Input
              label="Subject"
              required
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            />
            <Textarea
              label="Body"
              required
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEmailOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary">Send</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ======================= UI primitives & utils ======================= */
function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
function Input({ label, ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-gray-600">{label}</span>}
      <input
        {...rest}
        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30"
      />
    </label>
  );
}
function Textarea({ label, ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-gray-600">{label}</span>}
      <textarea
        {...rest}
        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30 min-h-[110px]"
      />
    </label>
  );
}
function Select({ label, options = [], ...rest }) {
  const opts = options.map((o) => (typeof o === "string" ? { v: o, t: o } : o));
  return (
    <label className="block">
      {label && <span className="block text-sm text-gray-600">{label}</span>}
      <select
        {...rest}
        className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500/30"
      >
        {opts.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </label>
  );
}
function Tag({ children, color = "slate" }) {
  const styles =
    color === "red" ? "bg-red-50 text-red-700 ring-red-200" : "bg-gray-100 text-gray-700 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${styles}`}>
      {children}
    </span>
  );
}
function StatusBadge({ status }) {
  const map = {
    Created: "bg-gray-100 text-gray-700 ring-gray-200",
    "Picked Up": "bg-sky-50 text-sky-700 ring-sky-200",
    "In Transit": "bg-blue-50 text-blue-700 ring-blue-200",
    "Out for Delivery": "bg-amber-50 text-amber-800 ring-amber-200",
    Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Exception: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
        map[status] || "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
function Th({ children }) {
  return <th className="text-left px-4 py-3 font-semibold">{children}</th>;
}
function Tr({ children }) {
  return <tr className="odd:bg-white even:bg-gray-50">{children}</tr>;
}
function Td({ children }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {/* make the content scrollable so long forms don't get cut off */}
        <div className="mt-4 overflow-y-auto max-h-[70vh] pr-1">{children}</div>
      </div>
    </div>
  );
}
function exportCSV(rows) {
  const headers = [
    "Date",
    "Tracking",
    "Service",
    "Status",
    "From",
    "To",
    "Recipient",
    "RecipientEmail",
    "Pieces",
    "Weight(kg)",
    "Cost(EUR)",
  ];
  const body = rows.map((s) => [
    s.date,
    s.tracking,
    s.service,
    s.status,
    s.from,
    s.to,
    s.toName || "",
    s.recipientEmail || "",
    s.pieces,
    s.weight,
    round2(s.cost),
  ]);
  const csv = [headers, ...body]
    .map((r) => r.map(csvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `admin_shipments_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function csvCell(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function formatMoney(n) {
  return (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
function toLocalDT(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}
function fromLocalDT(localStr) {
  if (!localStr) return "";
  const d = new Date(localStr);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() + off * 60000).toISOString();
}
function toast(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.className =
    "fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black text-white text-sm shadow";
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2400);
}

/* ======================= Icons ======================= */
function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" />
      <path d="M14 4l2 2" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <rect x="6" y="6" width="12" height="14" rx="2" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16v12H4z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
