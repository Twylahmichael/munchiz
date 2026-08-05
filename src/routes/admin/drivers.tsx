import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminDrivers() {
  return (
    <AdminCrudPage
      title="Drivers"
      table="drivers"
      searchField="name"
      columns={[
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        {
          key: "current_status",
          label: "Status",
          render: (v) => {
            const colors: Record<string, string> = { available: "bg-green-500/20 text-green-400", on_delivery: "bg-yellow-500/20 text-yellow-400", offline: "bg-white/10 text-white/40" };
            return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[v as string] || "bg-white/10 text-white/40"}`}>{(v as string)?.replace("_", " ")}</span>;
          },
        },
        { key: "is_active", label: "Active", render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>{v ? "Yes" : "No"}</span>
        )},
      ]}
      fields={[
        { key: "name", label: "Full Name", type: "text", required: true },
        { key: "phone", label: "Phone", type: "text", required: true, placeholder: "07XXXXXXXX" },
        { key: "current_status", label: "Status", type: "select", options: [{ value: "available", label: "Available" }, { value: "on_delivery", label: "On Delivery" }, { value: "offline", label: "Offline" }] },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ current_status: "offline", is_active: true }}
    />
  );
}

export const Route = createFileRoute("/admin/drivers")({ component: () => <AdminLayout><AdminDrivers /></AdminLayout> });
