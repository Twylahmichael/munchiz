import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminKitchen } from "@/components/admin/AdminKitchen";

export const Route = createFileRoute("/admin/operations")({ component: () => <AdminLayout><AdminKitchen /></AdminLayout> });
