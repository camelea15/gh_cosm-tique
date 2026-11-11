"use client";

import { SubmitButton } from "@/components/admin/submit-button";
import { useKeepFormAction } from "@/components/admin/use-form-action";
import type { ProductFormState } from "@/app/(admin)/admin/(panel)/produits/actions";

export type ProductFormValues = {
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  category_id: string;
  price_retail: string;
  price_wholesale: string;
  stock: string;
  image_url: string;
  sort_order: string;
  is_active: boolean;
};

export function ProductForm({
  action,
  values,
  categories,
  saved,
}: {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  values: ProductFormValues;
  categories: { id: number; name_fr: string }[];
  saved?: boolean;
}) {
  const { state, pending, onSubmit } = useKeepFormAction<ProductFormState>(action);
  const fe = state?.fieldErrors ?? {};
  const Err = ({ k }: { k: string }) =>
    fe[k] ? (
      <p className="mt-1.5 text-sm text-red-600" role="alert">
        {fe[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-6 sm:p-8">
      {(state?.ok || saved) && !state?.error && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Produit enregistré. Les modifications sont visibles sur le site.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name_fr" className="label">
            Nom (français) *
          </label>
          <input id="name_fr" name="name_fr" defaultValue={values.name_fr} required maxLength={120} className="field" />
          <Err k="name_fr" />
        </div>
        <div>
          <label htmlFor="name_ar" className="label">
            Nom (arabe, facultatif)
          </label>
          <input id="name_ar" name="name_ar" defaultValue={values.name_ar} maxLength={120} dir="rtl" className="field" />
          <p className="mt-1.5 text-xs text-muted">Si vide, le nom français est affiché sur la version arabe.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="description_fr" className="label">
            Description (français)
          </label>
          <textarea id="description_fr" name="description_fr" defaultValue={values.description_fr} maxLength={1500} className="field min-h-32 resize-y" />
        </div>
        <div>
          <label htmlFor="description_ar" className="label">
            Description (arabe)
          </label>
          <textarea id="description_ar" name="description_ar" defaultValue={values.description_ar} maxLength={1500} dir="rtl" className="field min-h-32 resize-y" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="price_retail" className="label">
            Prix de détail (DA) *
          </label>
          <input id="price_retail" name="price_retail" inputMode="numeric" defaultValue={values.price_retail} required className="field" />
          <Err k="price_retail" />
        </div>
        <div>
          <label htmlFor="price_wholesale" className="label">
            Prix de gros (DA) *
          </label>
          <input id="price_wholesale" name="price_wholesale" inputMode="numeric" defaultValue={values.price_wholesale} required className="field" />
          <Err k="price_wholesale" />
        </div>
        <div>
          <label htmlFor="stock" className="label">
            Stock
          </label>
          <input id="stock" name="stock" inputMode="numeric" defaultValue={values.stock} placeholder="Illimité" className="field" />
          <p className="mt-1.5 text-xs text-muted">Vide = illimité. 0 = rupture de stock.</p>
          <Err k="stock" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="category_id" className="label">
            Catégorie
          </label>
          <select id="category_id" name="category_id" defaultValue={values.category_id} className="field">
            <option value="">Sans catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_fr}
              </option>
            ))}
          </select>
          <Err k="category_id" />
        </div>
        <div>
          <label htmlFor="sort_order" className="label">
            Ordre d&apos;affichage
          </label>
          <input id="sort_order" name="sort_order" inputMode="numeric" defaultValue={values.sort_order} className="field" />
          <p className="mt-1.5 text-xs text-muted">Les plus petits numéros apparaissent en premier.</p>
          <Err k="sort_order" />
        </div>
        <div className="flex items-end pb-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" name="is_active" defaultChecked={values.is_active} className="h-5 w-5 accent-brand-600" />
            Visible sur le site
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="image_url" className="label">
          Photo (chemin ou lien)
        </label>
        <input
          id="image_url"
          name="image_url"
          defaultValue={values.image_url}
          placeholder="/products/nom-du-produit.webp"
          className="field"
          dir="ltr"
        />
        <p className="mt-1.5 text-xs text-muted">Chemin d&apos;une photo du site (ex. /products/serum-vitamine-c.webp) ou lien https://.</p>
        <Err k="image_url" />
      </div>

      <div className="flex justify-end">
        <SubmitButton pending={pending} className="btn btn-primary min-h-12 px-10">
          Enregistrer le produit
        </SubmitButton>
      </div>
    </form>
  );
}
