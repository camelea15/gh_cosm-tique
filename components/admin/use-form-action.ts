"use client";

import { startTransition, useActionState } from "react";

/**
 * Comme useActionState, mais sans la remise à zéro automatique du formulaire de React 19 :
 * en cas d'erreur, tout ce qui a été saisi reste à l'écran (on ne perd pas son travail).
 */
export function useKeepFormAction<S>(action: (prev: S | undefined, formData: FormData) => Promise<S | undefined>) {
  const [state, formAction, pending] = useActionState<S | undefined, FormData>(action, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };
  return { state, pending, onSubmit };
}
