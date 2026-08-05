import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminBranches() {
  return (
    <AdminCrudPage
      title="Branches"
      table="branches"
      searchField="name"
      columns={[
        { key: "name", label: "Branch Name" },
        { key: "address", label: "Address" },
        { key: "phone", label: "Phone" },
        { key: "is_active", label: "Active", render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>{v ? "Yes" : "No"}</span>
        )},
      ]}
      fields={[
        { key: "name", label: "Branch Name", type: "text", required: true },
        { key: "address", label: "Address", type: "textarea", required: true },
        { key: "phone", label: "Phone", type: "text" },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ is_active: true }}
    />
  );
}

export const Route = createFileRoute("/admin/branches")({ component: () => <AdminLayout><AdminBranches /></AdminLayout> });
