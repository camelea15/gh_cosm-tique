"use client";

import { useEffect, useRef, useState } from "react";
import { SubmitButton } from "@/components/admin/submit-button";
import { useKeepFormAction } from "@/components/admin/use-form-action";
import { loginAction, type FormState } from "./actions";

export function LoginForm() {
  const { state, pending, onSubmit } = useKeepFormAction<FormState>(loginAction);
  const pw = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(false);

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
        <input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          maxLength={200}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <div className="relative">
          <input
            ref={pw}
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={200}
            className="field pe-20"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-pressed={show}
            className="absolute inset-y-0 end-3 my-auto h-8 rounded-lg px-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            {show ? "Masquer" : "Afficher"}
          </button>
        </div>
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
