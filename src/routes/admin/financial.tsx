import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminFinancial } from "@/components/admin/AdminFinancial";

export const Route = createFileRoute("/admin/financial")({ component: () => <AdminLayout><AdminFinancial /></AdminLayout> });
