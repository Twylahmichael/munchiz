import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSiteSettings } from "@/components/admin/AdminSiteSettings";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <AdminLayout>
      <AdminSiteSettings />
    </AdminLayout>
  );
}
