"use client";

import { useEffect, useRef } from "react";
import { SubmitButton } from "@/components/admin/submit-button";
import { useKeepFormAction } from "@/components/admin/use-form-action";
import { loginAction, type FormState } from "./actions";

export function LoginForm() {
  const { state, pending, onSubmit } = useKeepFormAction<FormState>(loginAction);
  const pw = useRef<HTMLInputElement>(null);

  // En cas d'échec, on garde l'e-mail mais on efface le mot de passe.
  useEffect(() => {
    if (state?.error && pw.current) pw.current.value = "";
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">
          Adresse e-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={200} className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <input
          ref={pw}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className="field"
        />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton pending={pending} pendingLabel="Connexion…" className="btn btn-primary min-h-12 w-full text-base">
        Se connecter
      </SubmitButton>
    </form>
  );
}
