import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminVendors() {
  return (
    <AdminCrudPage
      title="Vendors / Suppliers"
      table="vendors"
      searchField="name"
      columns={[
        { key: "name", label: "Vendor Name" },
        { key: "contact_phone", label: "Phone" },
        { key: "contact_email", label: "Email", render: (v) => (v as string) || "—" },
        { key: "is_active", label: "Active", render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>{v ? "Yes" : "No"}</span>
        )},
      ]}
      fields={[
        { key: "name", label: "Vendor Name", type: "text", required: true },
        { key: "contact_phone", label: "Phone", type: "text", placeholder: "07XXXXXXXX" },
        { key: "contact_email", label: "Email", type: "text" },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ is_active: true }}
    />
  );
}

export const Route = createFileRoute("/admin/vendors")({ component: () => <AdminLayout><AdminVendors /></AdminLayout> });
