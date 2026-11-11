"use client";

import { useFormStatus } from "react-dom";

function Inner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn min-h-11 w-full border border-red-200 bg-white text-red-700 hover:bg-red-50"
    >
      {pending ? "Suppression…" : "Supprimer définitivement"}
    </button>
  );
}

export function DeleteOrderForm({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement cette commande ? Cette action est irréversible.")) e.preventDefault();
      }}
    >
      <Inner />
    </form>
  );
}
