import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminFlashSales() {
  return (
    <AdminCrudPage
      title="Flash Sales"
      table="flash_sales"
      columns={[
        { key: "menu_item_id", label: "Menu Item ID", render: (v) => (v as string)?.slice(0, 8) + "..." },
        { key: "flash_price", label: "Flash Price", render: (v) => `KES ${v}` },
        { key: "start_time", label: "Start", render: (v) => v ? new Date(v as string).toLocaleString("en-KE") : "—" },
        { key: "end_time", label: "End", render: (v) => v ? new Date(v as string).toLocaleString("en-KE") : "—" },
        { key: "sold_count", label: "Sold" },
        {
          key: "is_active",
          label: "Active",
          render: (v) => (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
              {v ? "Yes" : "No"}
            </span>
          ),
        },
      ]}
      fields={[
        { key: "menu_item_id", label: "Menu Item ID (UUID)", type: "text", required: true },
        { key: "flash_price", label: "Flash Price (KES)", type: "number", required: true },
        { key: "start_time", label: "Start Time", type: "datetime", required: true },
        { key: "end_time", label: "End Time", type: "datetime", required: true },
        { key: "max_quantity", label: "Max Quantity (blank = unlimited)", type: "number" },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ is_active: true }}
    />
  );
}

export const Route = createFileRoute("/admin/flash-sales")({ component: () => <AdminLayout><AdminFlashSales /></AdminLayout> });
