import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDealsManager } from "@/components/admin/AdminDealsManager";

export const Route = createFileRoute("/admin/deals")({
  component: AdminDealsPage,
});

function AdminDealsPage() {
  return (
    <AdminLayout>
      <AdminDealsManager />
    </AdminLayout>
  );
}
