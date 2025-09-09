import { useEffect, useState, useRef } from "react";

/** Loads Google script once */
const SCRIPT_ID = "google-translate-script";
const INIT_CB = "googleTranslateElementInit_GE";
let loadP = null;
let widgetReady = false;

function ensureScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.translate?.TranslateElement) return Promise.resolve();
  if (loadP) return loadP;

  loadP = new Promise((resolve) => {
    window[INIT_CB] = () => resolve();
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = `https://translate.google.com/translate_a/element.js?cb=${INIT_CB}`;
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
  });
  return loadP;
}

function mountWidget() {
  if (widgetReady) return;
  const mount = document.getElementById("google_translate_element");
  if (!mount || !window.google?.translate?.TranslateElement) return;

  // fresh mount
  mount.innerHTML = "";
  /* global google */
  new window.google.translate.TranslateElement(
    {
      pageLanguage: "en",
      includedLanguages:
        "en,fr,de,es,pt,it,ar,hi,ja,ko,zh-CN,ru,yo,ig,ha",
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false,
    },
    "google_translate_element"
  );
  widgetReady = true;
}

const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "简体中文" },
  { code: "ru", label: "Русский" },
];

export default function TranslateDot() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    (async () => {
      await ensureScript();
      mountWidget();
    })();

    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const setLanguage = async (code) => {
    // try via hidden select
    for (let i = 0; i < 25; i++) {
      const combo = document.querySelector("select.goog-te-combo");
      if (combo) {
        // some locales use values like 'zh-CN'
        const ok = [...combo.options].some((o) => o.value === code);
        if (!ok) break;
        combo.value = code;
        combo.dispatchEvent(new Event("change", { bubbles: true }));
        setOpen(false);
        return;
      }
      // wait a tick while widget renders
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 100));
    }

    // fallback: cookie + reload
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    const host = window.location.hostname;
    [ `/auto/${code}`, `/en/${code}` ].forEach((p) => {
      document.cookie = `googtrans=${p}; expires=${exp}; path=/`;
      document.cookie = `googtrans=${p}; expires=${exp}; domain=${host}; path=/`;
    });
    window.location.reload();
  };

  const current =
    document.cookie.match(/googtrans=\/(?:auto|en)\/([^;]+)/)?.[1] || "en";
  const currentLabel = LANGS.find((l) => l.code === current)?.label || "English";

  return (
    <div ref={menuRef} className="ge-translate-dot" title={currentLabel}>
      <button
        aria-label="Translate"
        className="ge-dot-btn"
        onClick={() => setOpen((v) => !v)}
      />
      {/* Hidden Google mount (kept tiny & invisible; no native dropdown) */}
      <div id="google_translate_element" className="ge-hidden-gt" aria-hidden="true" />

      {open && (
        <div className="ge-menu">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={`ge-menu-item ${l.code === current ? "is-active" : ""}`}
              onClick={() => setLanguage(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
