import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminRewards() {
  return (
    <AdminCrudPage
      title="Rewards & Loyalty"
      table="rewards"
      columns={[
        { key: "user_id", label: "User ID", render: (v) => (v as string)?.slice(0, 8) + "..." },
        { key: "points", label: "Points" },
        { key: "tier", label: "Tier", render: (v) => {
          const colors: Record<string, string> = { bronze: "text-orange-400", silver: "text-gray-300", gold: "text-yellow-400", platinum: "text-blue-300" };
          return <span className={`font-bold capitalize ${colors[v as string] || "text-white"}`}>{v as string}</span>;
        }},
      ]}
      fields={[
        { key: "user_id", label: "User ID (UUID)", type: "text", required: true },
        { key: "points", label: "Points", type: "number", required: true },
        { key: "tier", label: "Tier", type: "select", required: true, options: [{ value: "bronze", label: "Bronze" }, { value: "silver", label: "Silver" }, { value: "gold", label: "Gold" }, { value: "platinum", label: "Platinum" }] },
      ]}
      defaultValues={{ tier: "bronze", points: 0 }}
    />
  );
}

export const Route = createFileRoute("/admin/rewards")({ component: () => <AdminLayout><AdminRewards /></AdminLayout> });
