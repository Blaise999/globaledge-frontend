import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

function makeId() {
  const c = globalThis.crypto;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function GoodsPhotoUpload({ shipmentKey, photos, setPhotos }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErr("");
    setBusy(true);

    try {
      // OPTIONAL: limit count/size
      const remaining = Math.max(0, 3 - (photos?.length || 0));
      const chosen = files.slice(0, remaining);

      const uploaded = [];
      for (const file of chosen) {
        if (!file.type.startsWith("image/")) continue;

        const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
        const pathname = `shipments/${shipmentKey}/goods/${Date.now()}-${safeName}`;

        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/goods/upload",
          clientPayload: shipmentKey, // arrives as clientPayload in onBeforeGenerateToken
        });

        uploaded.push({
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
        });
      }

      setPhotos([...(photos || []), ...uploaded]);
    } catch (e) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-800">Goods photos (optional)</div>
          <div className="text-xs text-gray-500">Add up to 3 images — these will show on Tracking.</div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || (photos?.length || 0) >= 3}
          className={`px-3 py-2 rounded-lg text-sm font-semibold ${
            busy ? "bg-gray-300 text-gray-700" : "bg-black text-white"
          }`}
        >
          {busy ? "Uploading…" : "Add photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>

      {err && <div className="mt-2 text-xs text-red-600">{err}</div>}

      {!!(photos?.length) && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <a key={p.url + i} href={p.url} target="_blank" rel="noreferrer" className="block">
              <img
                src={p.url}
                alt={`Goods photo ${i + 1}`}
                className="h-20 w-full object-cover rounded-lg border"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
