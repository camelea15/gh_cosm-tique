"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ProductImage } from "@/components/shop/product-image";
import { useCart } from "@/components/shop/cart-provider";
import { formatDA, normalizePhone } from "@/lib/format";
import { fill, type Dict, type Locale } from "@/lib/i18n";
import { productName, wilayaName } from "@/lib/localize";
import type { Product, Wilaya } from "@/lib/data";

type Errors = Partial<Record<"name" | "phone" | "wilaya" | "address" | "consent" | "form", string>>;

export function CheckoutForm({
  products,
  wilayas,
  locale,
  t,
}: {
  products: Product[];
  wilayas: Wilaya[];
  locale: Locale;
  t: Dict;
}) {
  const router = useRouter();
  const { lines, ready, clear } = useCart();
  const openedAt = useRef<number>(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"stopdesk" | "domicile">("stopdesk");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // champ piège anti-robot
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const items = lines
    .map((l) => ({ line: l, product: byId.get(l.id) }))
    .filter((x): x is { line: (typeof lines)[number]; product: Product } => Boolean(x.product));

  const subtotal = items.reduce(
    (s, { line, product }) => s + (line.priceType === "gros" ? product.price_wholesale : product.price_retail) * line.qty,
    0,
  );
  const selected = wilayas.find((w) => String(w.code) === wilaya);
  const fee = selected ? (deliveryType === "stopdesk" ? selected.fee_stopdesk : selected.fee_home) : null;
  const total = subtotal + (fee ?? 0);
  const hasWholesale = items.some((x) => x.line.priceType === "gros");

  if (!ready) return <div className="h-64 animate-pulse rounded-2xl bg-brand-50" aria-hidden="true" />;

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <p className="text-lg font-medium">{t.checkout.errors.emptyCart}</p>
        <Link href={`/${locale}/produits`} className="btn btn-primary mt-6">
          {t.cart.emptyCta}
        </Link>
      </div>
    );
  }

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = t.checkout.errors.name;
    if (!normalizePhone(phone)) e.phone = t.checkout.errors.phone;
    if (!selected) e.wilaya = t.checkout.errors.wilaya;
    if (deliveryType === "domicile" && address.trim().length < 5) e.address = t.checkout.errors.address;
    if (!consent) e.consent = t.checkout.errors.consent;
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          wilaya: Number(wilaya),
          commune,
          address,
          deliveryType,
          note,
          consent: true,
          website,
          openedAt: openedAt.current,
          items: items.map(({ line }) => ({ id: line.id, priceType: line.priceType, qty: line.qty })),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        orderNumber?: string;
        total?: number;
        error?: string;
        fields?: string[];
      } | null;

      if (res.ok && data?.ok && data.orderNumber) {
        try {
          window.sessionStorage.setItem("gh_last_order", JSON.stringify({ n: data.orderNumber, total: data.total ?? total }));
        } catch {
          /* ignoré */
        }
        clear();
        router.push(`/${locale}/confirmation?n=${encodeURIComponent(data.orderNumber)}`);
        return;
      }

      const err: Errors = {};
      if (data?.error === "validation" && data.fields?.length) {
        if (data.fields.includes("phone")) err.phone = t.checkout.errors.phone;
        if (data.fields.includes("name")) err.name = t.checkout.errors.name;
        if (data.fields.includes("address")) err.address = t.checkout.errors.address;
        if (data.fields.includes("wilaya")) err.wilaya = t.checkout.errors.wilaya;
        if (!Object.keys(err).length) err.form = t.checkout.errors.generic;
      } else if (data?.error === "rate") err.form = t.checkout.errors.rate;
      else if (data?.error === "too_fast") err.form = t.checkout.errors.tooFast;
      else if (data?.error === "stock" || data?.error === "invalid_items") err.form = t.checkout.errors.stock;
      else err.form = t.checkout.errors.generic;
      setErrors(err);
    } catch {
      setErrors({ form: t.checkout.errors.generic });
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k: keyof Errors) => errors[k];
  const errId = (k: string) => `err-${k}`;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
      <div className="card space-y-6 p-5 sm:p-8">
        <p className="text-sm text-muted">{t.checkout.intro}</p>

        {/* Champ piège : invisible pour les humains, rempli par les robots. */}
        <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-name" className="label">
              {t.checkout.name} *
            </label>
            <input
              id="f-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.checkout.namePh}
              autoComplete="name"
              maxLength={80}
              aria-invalid={Boolean(err("name"))}
              aria-describedby={err("name") ? errId("name") : undefined}
            />
            {err("name") && (
              <p id={errId("name")} className="mt-1.5 text-sm text-red-600">
                {err("name")}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="f-phone" className="label">
              {t.checkout.phone} *
            </label>
            <input
              id="f-phone"
              className="field"
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.checkout.phonePh}
              autoComplete="tel"
              maxLength={24}
              aria-invalid={Boolean(err("phone"))}
              aria-describedby={err("phone") ? errId("phone") : "help-phone"}
            />
            {err("phone") ? (
              <p id={errId("phone")} className="mt-1.5 text-sm text-red-600">
                {err("phone")}
              </p>
            ) : (
              <p id="help-phone" className="mt-1.5 text-xs text-muted">
                {t.checkout.phoneHelp}
              </p>
            )}
          </div>
        </div>

        <fieldset>
          <legend className="label">{t.checkout.deliveryType} *</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { v: "stopdesk", title: t.checkout.stopdesk, help: t.checkout.stopdeskHelp, icon: "pin" },
                { v: "domicile", title: t.checkout.home, help: t.checkout.homeHelp, icon: "truck" },
              ] as const
            ).map((o) => {
              const active = deliveryType === o.v;
              const price = selected ? (o.v === "stopdesk" ? selected.fee_stopdesk : selected.fee_home) : null;
              return (
                <label
                  key={o.v}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                    active ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line bg-white hover:border-brand-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value={o.v}
                    checked={active}
                    onChange={() => setDeliveryType(o.v)}
                    className="sr-only"
                  />
                  <span className={`mt-0.5 ${active ? "text-brand-600" : "text-brand-300"}`}>
                    <Icon name={o.icon} size={22} />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{o.title}</span>
                      {price !== null && <span className="text-sm font-bold text-brand-700">{formatDA(price, locale)}</span>}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{o.help}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-wilaya" className="label">
              {t.checkout.wilaya} *
            </label>
            <select
              id="f-wilaya"
              className="field"
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              aria-invalid={Boolean(err("wilaya"))}
              aria-describedby={err("wilaya") ? errId("wilaya") : undefined}
            >
              <option value="">{t.checkout.wilayaPh}</option>
              {wilayas.map((w) => (
                <option key={w.code} value={w.code}>
                  {String(w.code).padStart(2, "0")} - {wilayaName(w, locale)}
                </option>
              ))}
            </select>
            {err("wilaya") && (
              <p id={errId("wilaya")} className="mt-1.5 text-sm text-red-600">
                {err("wilaya")}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="f-commune" className="label">
              {t.checkout.commune}
            </label>
            <input
              id="f-commune"
              className="field"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              placeholder={t.checkout.communePh}
              autoComplete="address-level2"
              maxLength={80}
            />
          </div>
        </div>

        <div>
          <label htmlFor="f-address" className="label">
            {t.checkout.address}
            {deliveryType === "domicile" ? " *" : ""}
          </label>
          <input
            id="f-address"
            className="field"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t.checkout.addressPh}
            autoComplete="street-address"
            maxLength={200}
            aria-invalid={Boolean(err("address"))}
            aria-describedby={err("address") ? errId("address") : "help-address"}
          />
          {err("address") ? (
            <p id={errId("address")} className="mt-1.5 text-sm text-red-600">
              {err("address")}
            </p>
          ) : (
            deliveryType === "domicile" && (
              <p id="help-address" className="mt-1.5 text-xs text-muted">
                {t.checkout.addressHelp}
              </p>
            )
          )}
        </div>

        <div>
          <label htmlFor="f-note" className="label">
            {t.checkout.note}
          </label>
          <textarea
            id="f-note"
            className="field min-h-24 resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.checkout.notePh}
            maxLength={300}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink/90">
            <input
              id="f-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-brand-600"
              aria-invalid={Boolean(err("consent"))}
              aria-describedby={err("consent") ? errId("consent") : undefined}
            />
            <span>
              {fill(t.checkout.consent, { link: "\u0000" })
                .split("\u0000")
                .map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <Link href={`/${locale}/confidentialite`} target="_blank" className="font-medium text-brand-700 underline underline-offset-2">
                        {t.checkout.consentLink}
                      </Link>
                    )}
                  </span>
                ))}
            </span>
          </label>
          {err("consent") && (
            <p id={errId("consent")} className="mt-1.5 text-sm text-red-600">
              {err("consent")}
            </p>
          )}
        </div>

        {err("form") && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err("form")}
          </p>
        )}
      </div>

      <aside className="card p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-xl font-semibold">{t.checkout.summary}</h2>
        <ul className="mt-5 space-y-4">
          {items.map(({ line, product }) => {
            const unit = line.priceType === "gros" ? product.price_wholesale : product.price_retail;
            const pn = productName(product, locale);
            return (
              <li key={product.id} className="flex items-center gap-3">
                <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  <ProductImage src={product.image_url} alt={pn} sizes="48px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium leading-snug">{pn}</span>
                  <span className="text-xs text-muted">
                    {line.qty} × {formatDA(unit, locale)}
                    {line.priceType === "gros" ? ` · ${t.checkout.wholesaleNotice}` : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold">{formatDA(unit * line.qty, locale)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t.checkout.subtotal}</dt>
            <dd className="font-medium">{formatDA(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t.checkout.deliveryFee}</dt>
            <dd className="font-medium">{fee === null ? t.checkout.chooseWilaya : formatDA(fee, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-semibold">{t.checkout.total}</dt>
            <dd className="text-xl font-bold text-brand-700">{fee === null ? "-" : formatDA(total, locale)}</dd>
          </div>
        </dl>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted">
          <Icon name="cash" size={16} className="mt-0.5 shrink-0 text-brand-600" />
          {t.checkout.payOnDelivery}
        </p>
        {hasWholesale && <span className="sr-only">{t.checkout.wholesaleNotice}</span>}
        <button type="submit" disabled={submitting} className="btn btn-primary mt-6 min-h-12 w-full text-base">
          {submitting ? t.checkout.submitting : t.checkout.submit}
        </button>
      </aside>
    </form>
  );
}
