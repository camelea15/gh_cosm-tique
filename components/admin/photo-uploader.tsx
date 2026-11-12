"use client";

import { useRef, useState } from "react";

const MAX_PHOTOS = 6; // 1 principale + 5 supplémentaires

/** Réduit la photo dans le navigateur (téléphone = souvent 5 à 10 Mo) avant de l'envoyer. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
      if (blob) return blob;
    }
  } catch {
    /* on envoie le fichier tel quel */
  }
  return file;
}

async function upload(file: File): Promise<string> {
  const blob = await shrink(file);
  if (blob.size > 4 * 1024 * 1024) throw new Error("Photo trop lourde (4 Mo maximum).");
  const body = new FormData();
  body.append("file", blob, "photo.jpg");
  const res = await fetch("/admin/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "L'envoi a échoué. Réessayez.");
  return data.url;
}

export function PhotoUploader({ initialMain, initialExtra }: { initialMain: string; initialExtra: string }) {
  const [urls, setUrls] = useState<string[]>(() =>
    [initialMain, ...initialExtra.split(/\r?\n/)].map((u) => u.trim()).filter(Boolean),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - urls.length);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    const added: string[] = [];
    try {
      for (const f of files) added.push(await upload(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi a échoué.");
    }
    if (added.length) setUrls((cur) => [...cur, ...added].slice(0, MAX_PHOTOS));
    setBusy(false);
  }

  const remove = (i: number) => setUrls((cur) => cur.filter((_, k) => k !== i));
  const makeMain = (i: number) => setUrls((cur) => [cur[i], ...cur.filter((_, k) => k !== i)]);

  return (
    <div>
      <span className="label">Photos du produit</span>
      <input type="hidden" name="image_url" value={urls[0] ?? ""} />
      <input type="hidden" name="extra_images" value={urls.slice(1).join("\n")} />

      {urls.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((u, i) => (
            <li key={u} className="rounded-2xl border border-line bg-white p-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-brand-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute start-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                    Principale
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeMain(i)}
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:bg-brand-50"
                  >
                    Mettre en principale
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPick} className="sr-only" id="photo-input" />
        <button
          type="button"
          disabled={busy || urls.length >= MAX_PHOTOS}
          onClick={() => input.current?.click()}
          className="btn btn-outline min-h-11"
        >
          {busy ? "Envoi en cours…" : urls.length ? "Ajouter une photo" : "Choisir une photo"}
        </button>
        <span className="text-xs text-muted">
          JPG, PNG ou WebP. {urls.length}/{MAX_PHOTOS} photos. N&apos;oubliez pas d&apos;enregistrer le produit.
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
