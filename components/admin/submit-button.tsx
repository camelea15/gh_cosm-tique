"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "Enregistrement…",
  className = "btn btn-primary",
  pending: pendingOverride,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  /** À fournir quand le formulaire utilise onSubmit (useKeepFormAction) au lieu de l'attribut action. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
