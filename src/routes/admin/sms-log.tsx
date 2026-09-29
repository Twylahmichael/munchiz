import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSmsLog } from "@/components/admin/AdminSmsLog";

export const Route = createFileRoute("/admin/sms-log")({
  component: AdminSmsLogPage,
});

function AdminSmsLogPage() {
  return (
    <AdminLayout>
      <AdminSmsLog />
    </AdminLayout>
  );
}
