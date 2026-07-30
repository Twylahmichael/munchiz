import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminZones() {
  return (
    <AdminCrudPage
      title="Delivery Zones"
      table="zones"
      searchField="name"
      columns={[
        { key: "name", label: "Zone Name" },
        { key: "delivery_fee", label: "Delivery Fee", render: (v) => `KES ${v}` },
        { key: "estimated_time_minutes", label: "Est. Time", render: (v) => v ? `${v} min` : "—" },
        { key: "is_active", label: "Active", render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>{v ? "Yes" : "No"}</span>
        )},
      ]}
      fields={[
        { key: "name", label: "Zone Name", type: "text", required: true },
        { key: "delivery_fee", label: "Delivery Fee (KES)", type: "number", required: true },
        { key: "estimated_time_minutes", label: "Estimated Delivery Time (min)", type: "number" },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ is_active: true, delivery_fee: 100, estimated_time_minutes: 30 }}
    />
  );
}

export const Route = createFileRoute("/admin/zones")({ component: () => <AdminLayout><AdminZones /></AdminLayout> });
