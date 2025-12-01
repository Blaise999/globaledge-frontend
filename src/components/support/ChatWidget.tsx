// src/components/support/ChatWidget.tsx
"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "../../libs/supabaseClient";

type ChatMessage = {
  id: string;
  sender: "visitor" | "admin";
  text: string;
  created_at: string;
};

const STORAGE_KEY = "ge_support_conversation_id_v1";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // restore existing conversation if user has one
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setConversationId(saved);
  }, []);

  // load + subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("ge_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!cancelled && !error && data) {
        setMessages(data as ChatMessage[]);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`ge-conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ge_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function fetchGeo() {
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipJson = await ipRes.json();
      const ip = ipJson?.ip as string | undefined;
      if (!ip) return {};

      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geo = await geoRes.json();

      return {
        ip,
        city: geo.city as string | undefined,
        region: geo.region as string | undefined,
        country: geo.country_name as string | undefined,
        country_code: geo.country_code as string | undefined,
        timezone: geo.timezone as string | undefined,
      };
    } catch {
      return {};
    }
  }

  async function ensureConversation() {
    if (conversationId) return conversationId;
    setLoading(true);

    const geo = await fetchGeo();

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        name: name || null,
        email: email || null,
        first_page: window.location.href,
        user_agent: navigator.userAgent,
        status: "open",
        ...geo,
      })
      .select("id")
      .single();

    setLoading(false);

    if (error || !data) {
      console.error("create ge_conversation error", error);
      return null;
    }

    const id = data.id as string;
    setConversationId(id);
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  }

  async function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    const convId = await ensureConversation();
    if (!convId) return;

    const temp: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "visitor",
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    const { error } = await supabase.from("ge_messages").insert({
      conversation_id: convId,
      sender: "visitor",
      text,
    });
    if (error) console.error("send ge_message error", error);

    await supabase
      .from("conversations")
      .update({ last_message: text, status: "open" })
      .eq("id", convId);
  }

  const suggestions = [
    "I want to ship from France to the US – how does it work?",
    "What are your rates for Europe-bound shipments?",
    "Can you help with customs and last-mile delivery?",
  ];

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="
          fixed 
          right-5 bottom-8
          md:right-8 md:bottom-10 
          z-40
          flex h-12 w-12 items-center justify-center 
          rounded-full shadow-lg bg-black text-white
        "
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="
            fixed 
            right-5 bottom-24
            md:right-8 md:bottom-28
            z-40
            w-80 max-w-[90vw]
            rounded-2xl shadow-xl bg-white flex flex-col overflow-hidden
          "
        >
          <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-900 text-white">
            <div>
              <div className="text-sm font-semibold">
                Global Edge Support
              </div>
              <div className="text-[11px] text-slate-200">
                Shipping & logistics assistance
              </div>
            </div>
            <button onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Intro */}
          <div className="px-4 py-3 border-b bg-slate-50 text-[11px] leading-relaxed space-y-1">
            <p className="text-slate-700">
              Tell us your{" "}
              <span className="font-semibold">
                origin, destination, shipment type and timing
              </span>{" "}
              and we&apos;ll guide you on the best options.
            </p>
            <p className="text-slate-600">
              Typical reply:{" "}
              <span className="font-semibold">under 30 minutes</span> during
              business hours.
            </p>
          </div>

          {/* Name / email */}
          {!conversationId && (
            <div className="px-4 py-3 border-b space-y-2 text-[11px]">
              <p className="text-slate-700">
                Add your details so a coordinator can follow up:
              </p>
              <input
                className="w-full border rounded-md px-2 py-1 text-[11px]"
                placeholder="Full name / company"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full border rounded-md px-2 py-1 text-[11px]"
                placeholder="Email (for quotes & tracking)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 px-3 py-2 overflow-y-auto space-y-2 text-xs bg-slate-50">
            {messages.length === 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-slate-600 text-[11px]">
                  You can start with one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInput(s)}
                      className="rounded-full border px-3 py-1 text-[11px] bg-white hover:bg-slate-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.sender === "visitor" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    m.sender === "visitor"
                      ? "bg-slate-900 text-white"
                      : "bg-white border text-slate-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            className="border-t flex items-center px-2 py-2 gap-2 bg-white"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              className="flex-1 text-xs px-2 py-2 rounded-full border"
              placeholder={
                loading ? "Starting conversation…" : "Type your message…"
              }
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 rounded-full bg-slate-900 text-white disabled:opacity-60"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
