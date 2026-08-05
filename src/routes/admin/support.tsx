import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminSupport() {
  return (
    <AdminCrudPage
      title="Support Tickets"
      table="support_tickets"
      searchField="subject"
      columns={[
        { key: "subject", label: "Subject" },
        { key: "priority", label: "Priority", render: (v) => {
          const colors: Record<string, string> = { low: "text-white/40", medium: "text-yellow-400", high: "text-orange-400", urgent: "text-red-400" };
          return <span className={`font-bold text-xs uppercase ${colors[v as string] || "text-white/40"}`}>{v as string}</span>;
        }},
        { key: "status", label: "Status", render: (v) => {
          const colors: Record<string, string> = { open: "bg-blue-500/20 text-blue-400", in_progress: "bg-yellow-500/20 text-yellow-400", resolved: "bg-green-500/20 text-green-400", closed: "bg-white/10 text-white/40" };
          return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[v as string] || "bg-white/10 text-white/40"}`}>{(v as string)?.replace("_", " ")}</span>;
        }},
        { key: "created_at", label: "Created", render: (v) => new Date(v as string).toLocaleDateString("en-KE") },
      ]}
      fields={[
        { key: "subject", label: "Subject", type: "text", required: true },
        { key: "message", label: "Message", type: "textarea", required: true },
        { key: "priority", label: "Priority", type: "select", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }] },
        { key: "status", label: "Status", type: "select", options: [{ value: "open", label: "Open" }, { value: "in_progress", label: "In Progress" }, { value: "resolved", label: "Resolved" }, { value: "closed", label: "Closed" }] },
      ]}
      defaultValues={{ status: "open", priority: "medium" }}
    />
  );
}

export const Route = createFileRoute("/admin/support")({ component: () => <AdminLayout><AdminSupport /></AdminLayout> });
