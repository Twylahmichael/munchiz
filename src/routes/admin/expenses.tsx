import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

function AdminExpenses() {
  return (
    <AdminCrudPage
      title="Expenses"
      table="expenses"
      searchField="title"
      columns={[
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount (KES)", render: (v) => `KES ${Number(v).toLocaleString()}` },
        { key: "date", label: "Date", render: (v) => v ? new Date(v as string).toLocaleDateString("en-KE") : "—" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "category", label: "Category", type: "select", required: true, options: [
          { value: "ingredients", label: "Ingredients" }, { value: "packaging", label: "Packaging" },
          { value: "utilities", label: "Utilities" }, { value: "rent", label: "Rent" },
          { value: "salaries", label: "Salaries" }, { value: "transport", label: "Transport" },
          { value: "equipment", label: "Equipment" }, { value: "marketing", label: "Marketing" },
          { value: "other", label: "Other" },
        ]},
        { key: "amount", label: "Amount (KES)", type: "number", required: true },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      defaultValues={{ category: "ingredients" }}
    />
  );
}

export const Route = createFileRoute("/admin/expenses")({ component: () => <AdminLayout><AdminExpenses /></AdminLayout> });
