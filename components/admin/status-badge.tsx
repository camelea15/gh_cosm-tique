import { STATUS_LABEL, STATUS_STYLE, isStatus } from "@/lib/admin-format";

export function StatusBadge({ status }: { status: string }) {
  const s = isStatus(status) ? status : "en_attente";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[s]}`}>
      {STATUS_LABEL[s]}
    </span>
  );
}
