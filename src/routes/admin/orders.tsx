import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOrdersManager } from "@/components/admin/AdminOrdersManager";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  return (
    <AdminLayout>
      <AdminOrdersManager />
    </AdminLayout>
  );
}
