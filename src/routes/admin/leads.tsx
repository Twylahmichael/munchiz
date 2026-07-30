import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminLeads() {
  return (
    <AdminCrudPage
      title="Customer Leads"
      table="customer_leads"
      searchField="name"
      columns={[
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email", render: (v) => (v as string) || "—" },
        { key: "source", label: "Source", render: (v) => (
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60 capitalize">{v as string}</span>
        )},
        { key: "status", label: "Status", render: (v) => {
          const colors: Record<string, string> = { new: "bg-blue-500/20 text-blue-400", contacted: "bg-yellow-500/20 text-yellow-400", converted: "bg-green-500/20 text-green-400", lost: "bg-red-500/20 text-red-400" };
          return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[v as string] || "bg-white/10 text-white/40"}`}>{v as string}</span>;
        }},
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "phone", label: "Phone", type: "text", required: true },
        { key: "email", label: "Email", type: "text" },
        { key: "source", label: "Source", type: "select", required: true, options: [{ value: "walk_in", label: "Walk-In" }, { value: "social_media", label: "Social Media" }, { value: "referral", label: "Referral" }, { value: "website", label: "Website" }, { value: "other", label: "Other" }] },
        { key: "status", label: "Status", type: "select", options: [{ value: "new", label: "New" }, { value: "contacted", label: "Contacted" }, { value: "converted", label: "Converted" }, { value: "lost", label: "Lost" }] },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      defaultValues={{ status: "new", source: "walk_in" }}
    />
  );
}

export const Route = createFileRoute("/admin/leads")({ component: () => <AdminLayout><AdminLeads /></AdminLayout> });
