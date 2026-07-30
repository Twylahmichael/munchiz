import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminCampaigns() {
  return (
    <AdminCrudPage
      title="Campaigns"
      table="campaigns"
      searchField="name"
      columns={[
        { key: "name", label: "Campaign" },
        { key: "type", label: "Type" },
        { key: "target_audience", label: "Audience" },
        { key: "status", label: "Status", render: (v) => {
          const colors: Record<string, string> = { draft: "bg-white/10 text-white/40", scheduled: "bg-blue-500/20 text-blue-400", sent: "bg-green-500/20 text-green-400", cancelled: "bg-red-500/20 text-red-400" };
          return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[v as string] || "bg-white/10 text-white/40"}`}>{v as string}</span>;
        }},
        { key: "scheduled_at", label: "Scheduled", render: (v) => v ? new Date(v as string).toLocaleDateString("en-KE") : "—" },
      ]}
      fields={[
        { key: "name", label: "Campaign Name", type: "text", required: true },
        { key: "type", label: "Type", type: "select", required: true, options: [{ value: "sms", label: "SMS" }, { value: "email", label: "Email" }, { value: "push_notification", label: "Push Notification" }, { value: "in_app", label: "In-App Banner" }] },
        { key: "target_audience", label: "Target Audience", type: "select", required: true, options: [{ value: "all", label: "All Customers" }, { value: "new_customers", label: "New Customers" }, { value: "returning", label: "Returning" }, { value: "inactive", label: "Inactive" }] },
        { key: "message", label: "Message", type: "textarea" },
        { key: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draft" }, { value: "scheduled", label: "Scheduled" }, { value: "sent", label: "Sent" }, { value: "cancelled", label: "Cancelled" }] },
        { key: "scheduled_at", label: "Scheduled Date", type: "datetime" },
      ]}
      defaultValues={{ status: "draft", type: "sms", target_audience: "all" }}
    />
  );
}

export const Route = createFileRoute("/admin/campaigns")({ component: () => <AdminLayout><AdminCampaigns /></AdminLayout> });
