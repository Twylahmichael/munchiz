import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAddonsManager } from "@/components/admin/AdminAddonsManager";

export const Route = createFileRoute("/admin/addons")({
  component: () => (
    <AdminLayout>
      <AdminAddonsManager />
    </AdminLayout>
  ),
});
