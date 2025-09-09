let loading = null;

export function loadGoogleTranslate(cbName = "googleTranslateElementInit") {
  if (window.google?.translate?.TranslateElement) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve) => {
    window[cbName] = () => resolve(); // resolves when script calls back
    const s = document.createElement("script");
    s.src = `//translate.google.com/translate_a/element.js?cb=${cbName}`;
    s.async = true;
    document.body.appendChild(s);
  });

  return loading;
}
