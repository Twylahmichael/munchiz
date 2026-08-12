import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminZones() {
  return (
    <AdminCrudPage
      title="Delivery Zones"
      table="zones"
      searchField="name"
      columns={[
        { key: "name", label: "Zone Name" },
        { key: "delivery_fee", label: "Delivery Fee", render: (v) => `KES ${v}` },
        { key: "estimated_time_minutes", label: "Est. Time", render: (v) => v ? `${v} min` : "—" },
        { key: "areas", label: "Areas", render: (v) => {
          const areas = v as string[] | null;
          if (!areas || areas.length === 0) return <span className="text-white/30">—</span>;
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {areas.slice(0, 3).map((area, i) => (
                <span key={i} className="bg-white/10 text-white/70 text-[10px] px-1.5 py-0.5 rounded-full">{area}</span>
              ))}
              {areas.length > 3 && (
                <span className="text-white/40 text-[10px]">+{areas.length - 3} more</span>
              )}
            </div>
          );
        }},
        { key: "is_active", label: "Active", render: (v) => (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${v ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>{v ? "Yes" : "No"}</span>
        )},
      ]}
      fields={[
        { key: "name", label: "Zone Name", type: "text", required: true },
        { key: "description", label: "Description", type: "text", placeholder: "e.g. Covers Kamulu and surrounding areas" },
        { key: "delivery_fee", label: "Delivery Fee (KES)", type: "number", required: true },
        { key: "estimated_time_minutes", label: "Estimated Delivery Time (min)", type: "number" },
        { key: "areas", label: "Areas (comma-separated)", type: "text", placeholder: "e.g. Kamulu, Joska, Kantafu, Malaa", transform: "csv_to_array" },
        { key: "is_active", label: "Active", type: "toggle" },
      ]}
      defaultValues={{ is_active: true, delivery_fee: 100, estimated_time_minutes: 30, areas: [] }}
    />
  );
}

export const Route = createFileRoute("/admin/zones")({ component: () => <AdminLayout><AdminZones /></AdminLayout> });
