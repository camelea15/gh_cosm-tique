"use client";

import { useEffect, useRef } from "react";
import { SubmitButton } from "@/components/admin/submit-button";
import { useKeepFormAction } from "@/components/admin/use-form-action";
import { changePasswordAction, type PwState } from "./actions";

export function PasswordForm() {
  const { state, pending, onSubmit } = useKeepFormAction<PwState>(changePasswordAction);
  const formRef = useRef<HTMLFormElement>(null);

  // Les mots de passe ne restent jamais affichés après l'envoi, qu'il réussisse ou non.
  useEffect(() => {
    if (state) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {state?.ok && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Mot de passe modifié. Vos autres sessions ont été fermées.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="current" className="label">
          Mot de passe actuel
        </label>
        <input id="current" name="current" type="password" autoComplete="current-password" required maxLength={200} className="field" />
      </div>
      <div>
        <label htmlFor="next" className="label">
          Nouveau mot de passe
        </label>
        <input id="next" name="next" type="password" autoComplete="new-password" required minLength={12} maxLength={72} className="field" />
        <p className="mt-1.5 text-xs text-muted">12 caractères minimum, avec des lettres et des chiffres.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">
          Confirmer le nouveau mot de passe
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={72} className="field" />
      </div>
      <SubmitButton pending={pending} className="btn btn-primary min-h-11">
        Changer le mot de passe
      </SubmitButton>
    </form>
  );
}
