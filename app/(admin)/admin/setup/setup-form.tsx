"use client";

import { useEffect, useRef } from "react";
import { SubmitButton } from "@/components/admin/submit-button";
import { useKeepFormAction } from "@/components/admin/use-form-action";
import { setupAction, type FormState } from "./actions";

export function SetupForm() {
  const { state, pending, onSubmit } = useKeepFormAction<FormState>(setupAction);
  const formRef = useRef<HTMLFormElement>(null);

  // En cas d'erreur, on efface les mots de passe mais on garde le reste.
  useEffect(() => {
    if (!state?.error || !formRef.current) return;
    for (const name of ["password", "confirm"]) {
      const el = formRef.current.elements.namedItem(name) as HTMLInputElement | null;
      if (el) el.value = "";
    }
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="token" className="label">
          Jeton de configuration
        </label>
        <input id="token" name="token" type="password" autoComplete="off" required className="field" />
        <p className="mt-1.5 text-xs text-muted">La valeur de la variable ADMIN_SETUP_TOKEN définie dans Vercel.</p>
      </div>
      <div>
        <label htmlFor="email" className="label">
          Votre adresse e-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={200} className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} className="field" />
        <p className="mt-1.5 text-xs text-muted">12 caractères minimum, avec des lettres et des chiffres.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">
          Confirmer le mot de passe
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={72} className="field" />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton pending={pending} pendingLabel="Création…" className="btn btn-primary min-h-12 w-full text-base">
        Créer le compte administrateur
      </SubmitButton>
    </form>
  );
}
