// src/pages/info/ContactPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/globaledge.png";

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", topic: "Support", message: "" });
  const [sending, setSending] = useState(false);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast("Please fill in your name, email, and message.");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate network
    setSending(false);
    toast("Thanks! We’ve received your message.");
    setForm({ name: "", email: "", topic: "Support", message: "" });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </a>
            <div className="flex items-center gap-2">
              <Link to="/faq" className="btn-secondary">FAQ</Link>
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-black">Contact us</h1>
          <p className="mt-2 text-white/95 max-w-2xl">
            We’ll reply quickly during support hours. 
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
          <h2 className="font-semibold">Send a message</h2>
          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <Field label="Full name">
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="input"
                placeholder="Ada Lovelace"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="input"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Topic">
                <select name="topic" value={form.topic} onChange={onChange} className="input">
                  <option>Support</option>
                  <option>Sales</option>
                  <option>Partnerships</option>
                </select>
              </Field>
            </div>
            <Field label="Message">
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                className="input min-h-[120px]"
                placeholder="Tell us how we can help…"
              />
            </Field>
            <div className="flex justify-end">
              <button disabled={sending} className="btn-primary">
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <h3 className="font-semibold">Quick contacts</h3>
          <Line k="Email" v="support@globaledge.example" />
          <Line k="Phone" v="+44 000 000 0000" />
          <Line k="Hours" v="Mon–Fri, 9:00–18:00" />
          <Line k="HQ" v="12 Marina Rd, Brussels, Belgium" />
          <p className="text-xs text-gray-500">
            This is a simulation site. The contacts above are placeholders.
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Line({ k, v }) {
  return (
    <div className="rounded-xl border p-4 text-sm">
      <div className="text-gray-500">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
function toast(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.className =
    "fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black text-white text-sm shadow";
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2400);
}
