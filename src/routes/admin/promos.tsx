import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminPromos() {
  return (
    <AdminCrudPage
      title="Promo Codes"
      table="promos"
      searchField="code"
      columns={[
        { key: "code", label: "Code", render: (v) => <span className="font-mono text-amber-400">{v as string}</span> },
        { key: "discount_type", label: "Type" },
        { key: "discount_value", label: "Value" },
        { key: "times_used", label: "Used" },
        { key: "max_uses", label: "Max Uses", render: (v) => v ?? "∞" },
        { key: "end_date", label: "Expires", render: (v) => v ? new Date(v as string).toLocaleDateString("en-KE") : "Never" },
        { key: "is_active", label: "Active", render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>{v ? "Yes" : "No"}</span>
        )},
      ]}
      fields={[
        { key: "code", label: "Promo Code", type: "text", required: true, placeholder: "MUNCH20" },
        { key: "discount_type", label: "Discount Type", type: "select", required: true, options: [{ value: "percentage", label: "Percentage" }, { value: "fixed", label: "Fixed Amount" }] },
        { key: "discount_value", label: "Discount Value", type: "number", required: true },
        { key: "min_order_amount", label: "Min Order Amount (KES)", type: "number" },
        { key: "max_uses", label: "Max Uses (blank = unlimited)", type: "number" },
        { key: "end_date", label: "Expires At", type: "datetime", required: true },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ is_active: true, discount_type: "percentage" }}
    />
  );
}

export const Route = createFileRoute("/admin/promos")({ component: () => <AdminLayout><AdminPromos /></AdminLayout> });
