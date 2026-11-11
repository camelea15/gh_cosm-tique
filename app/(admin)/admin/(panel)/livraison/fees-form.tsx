"use client";

import { SubmitButton } from "@/components/admin/submit-button";
import { useKeepFormAction } from "@/components/admin/use-form-action";
import { saveFeesAction, type FeesState } from "./actions";

type W = { code: number; name_fr: string; fee_stopdesk: number; fee_home: number };

export function FeesForm({ wilayas }: { wilayas: W[] }) {
  const { state, pending, onSubmit } = useKeepFormAction<FeesState>(saveFeesAction);
  return (
    <form onSubmit={onSubmit}>
      {state?.ok && (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Tarifs enregistrés. Ils sont déjà appliqués sur le site.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="bg-brand-50 text-xs uppercase tracking-wider text-brand-800">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">Wilaya</th>
              <th className="px-4 py-3 text-start font-semibold">Stop desk (DA)</th>
              <th className="px-4 py-3 text-start font-semibold">À domicile (DA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {wilayas.map((w) => (
              <tr key={w.code}>
                <th scope="row" className="px-4 py-2 text-start font-medium">
                  <span className="me-2 text-xs tabular-nums text-muted">{String(w.code).padStart(2, "0")}</span>
                  {w.name_fr}
                </th>
                <td className="px-4 py-2">
                  <input
                    name={`sd_${w.code}`}
                    defaultValue={w.fee_stopdesk}
                    inputMode="numeric"
                    className="field w-28 py-2"
                    aria-label={`Stop desk ${w.name_fr}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    name={`hm_${w.code}`}
                    defaultValue={w.fee_home}
                    inputMode="numeric"
                    className="field w-28 py-2"
                    aria-label={`À domicile ${w.name_fr}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-end">
        <SubmitButton pending={pending} className="btn btn-primary min-h-12 px-10">
          Enregistrer les tarifs
        </SubmitButton>
      </div>
    </form>
  );
}
