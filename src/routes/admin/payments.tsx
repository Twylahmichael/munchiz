import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPayments } from "@/components/admin/AdminPayments";

export const Route = createFileRoute("/admin/payments")({ component: () => <AdminLayout><AdminPayments /></AdminLayout> });
