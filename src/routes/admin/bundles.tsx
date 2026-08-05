import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminBundles() {
  return (
    <AdminCrudPage
      title="Bundles"
      table="bundles"
      searchField="name"
      columns={[
        { key: "name", label: "Name" },
        { key: "bundle_price", label: "Price (KES)", render: (v) => `KES ${v}` },
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
        { key: "name", label: "Bundle Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "bundle_price", label: "Price (KES)", type: "number", required: true },
        { key: "photo_url", label: "Image URL", type: "text" },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ is_active: true }}
    />
  );
}

export const Route = createFileRoute("/admin/bundles")({ component: () => <AdminLayout><AdminBundles /></AdminLayout> });
