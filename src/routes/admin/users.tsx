import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminUsers } from "@/components/admin/AdminUsers";

export const Route = createFileRoute("/admin/users")({ component: () => <AdminLayout><AdminUsers /></AdminLayout> });
