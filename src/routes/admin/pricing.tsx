import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminMenuManager } from "@/components/admin/AdminMenuManager";

export const Route = createFileRoute("/admin/pricing")({ component: () => <AdminLayout><AdminMenuManager /></AdminLayout> });
