"use client";

import { useState } from "react";
import { ProductImage } from "@/components/shop/product-image";

export function ProductGallery({ images, alt, sizes }: { images: string[]; alt: string; sizes: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0] ?? null;
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-brand-50 shadow-soft ring-1 ring-line">
        <ProductImage src={current} alt={alt} sizes={sizes} priority />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${alt} — ${i + 1}/${images.length}`}
                aria-pressed={i === index}
                className={`relative block h-20 w-16 overflow-hidden rounded-xl bg-brand-50 ring-2 transition sm:h-24 sm:w-20 ${
                  i === index ? "ring-brand-600" : "ring-line hover:ring-brand-300"
                }`}
              >
                <ProductImage src={src} alt="" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
