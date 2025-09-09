// Singleton loader + helpers for Google Website Translator
const SCRIPT_ID = "google-translate-script";
const INIT_CB   = "googleTranslateElementInit_GE";

let loadPromise    = null;
let cssInjected    = false;
let bannerObserver = null;

/** Load Google’s website translator script once (HTTPS + callback + onload fallback) */
export function loadGoogleTranslate() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.translate?.TranslateElement) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    window[INIT_CB] = () => {
      console.debug("[GT] callback fired");
      resolve();
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = `https://translate.google.com/translate_a/element.js?cb=${INIT_CB}`;
      s.async = true;
      s.defer = true;

      s.onload = () => {
        if (window.google?.translate?.TranslateElement) {
          console.debug("[GT] script onload (no cb)");
          resolve();
        }
      };
      s.onerror = (e) => {
        console.error("[GT] script load failed", e);
        reject(new Error("Google translate script blocked"));
      };

      document.body.appendChild(s);
    }
  });

  return loadPromise;
}

/** Create (or re-create) the Google widget so the engine is available */
export function initWidget(containerId = "google_translate_element") {
  if (!window.google?.translate?.TranslateElement) {
    console.debug("[GT] initWidget: google.translate not ready");
    return;
  }
  const mount = document.getElementById(containerId);
  if (!mount) {
    console.debug("[GT] initWidget: container not found");
    return;
  }

  // Force a fresh mount every time in case a previous attempt failed
  try { mount.innerHTML = ""; } catch {}

  try {
    /* global google */
    console.debug("[GT] creating TranslateElement");
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,fr,de,es,pt,it,ar,hi,ja,ko,zh-CN,ru,yo,ig,ha",
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      },
      containerId
    );
  } catch (e) {
    console.error("[GT] TranslateElement create failed", e);
  }
}

/** Inject CSS once to hide banners and prevent body offset (but NOT the translation layer) */
export function ensureBannerHidden() {
  if (cssInjected) return;
  const css = `
    .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame { display:none!important; }
    #goog-gt-tt, .goog-tooltip, .goog-te-balloon-frame { display:none!important; }
    /* Extension UI */
    .VIpgJd-ZVi9od-l4eHX-hSRGPd, .VIpgJd-ZVi9od-vH1Gmf-ibnC6b, .VIpgJd-ZVi9od-ORHb-OEVmcd { display:none!important; }
    html { margin-top:0!important; }
    body { top:0!important; position:static!important; }
    #google_translate_element .goog-logo-link,
    #google_translate_element .goog-te-gadget span,
    #google_translate_element .goog-te-gadget .goog-te-gadget-icon { display:none!important; }
    #google_translate_element .goog-te-gadget { font-size:0; line-height:0; }
  `;
  const style = document.createElement("style");
  style.setAttribute("data-gt-cleanup", "true");
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
  cssInjected = true;
}

/** Try to change the hidden <select>. Retry a few times. */
async function changeComboTo(code, retries = 25, delayMs = 120) {
  for (let i = 0; i < retries; i++) {
    const combo = document.querySelector("select.goog-te-combo"); // search globally
    if (combo) {
      if (![...combo.options].some(o => o.value === code)) {
        console.warn("[GT] language not in options:", code);
        return false;
      }
      console.debug("[GT] switching via select ->", code);
      combo.value = code;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    // wait and try again (widget may still be building)
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, delayMs));
  }
  console.warn("[GT] select.goog-te-combo not found after retries");
  return false;
}

/** Programmatic switch (preferred). Cookie + reload is fallback. */
export async function setLanguage(code) {
  try {
    await loadGoogleTranslate();
  } catch (e) {
    console.error("[GT] script blocked; using cookie fallback", e);
    return cookieFallback(code);
  }

  initWidget("google_translate_element");

  const switched = await changeComboTo(code);
  if (switched) return;

  // fallback: cookies + reload so Google auto-applies on load
  cookieFallback(code);
}

function cookieFallback(code) {
  const host = window.location.hostname;
  const exp  = new Date(Date.now() + 365*24*60*60*1000).toUTCString(); // 1 year
  const pairs = [`/auto/${code}`, `/en/${code}`];

  console.debug("[GT] setting cookies + reload fallback", pairs);
  pairs.forEach((p) => {
    document.cookie = `googtrans=${p}; expires=${exp}; path=/`;
    document.cookie = `googtrans=${p}; expires=${exp}; domain=${host}; path=/`;
  });
  window.location.reload();
}

/** Aggressively remove/keep removing any Google/extension banner & offsets (not the translation layer) */
export function killBannerForever() {
  const hide = () => {
    const selectors = [
      ".goog-te-banner-frame",
      ".goog-te-banner-frame.skiptranslate",
      "#goog-gt-tt",
      ".goog-tooltip",
      ".goog-te-balloon-frame",
      ".VIpgJd-ZVi9od-l4eHX-hSRGPd",
      ".VIpgJd-ZVi9od-vH1Gmf-ibnC6b",
      ".VIpgJd-ZVi9od-ORHb-OEVmcd",
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        try {
          el.style.setProperty("display", "none", "important");
          if (el.tagName === "IFRAME" && el.parentNode) el.parentNode.removeChild(el);
        } catch {}
      });
    });
    document.documentElement.style.setProperty("margin-top", "0px", "important");
    document.body.style.setProperty("top", "0px", "important");
    document.body.style.setProperty("position", "static", "important");
  };

  hide();
  if (!bannerObserver) {
    bannerObserver = new MutationObserver(hide);
    bannerObserver.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("resize", hide, { passive: true });
  }
}
