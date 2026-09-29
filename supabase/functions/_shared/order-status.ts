// Customer-facing labels/messages for Munchiz's existing OrderStatus enum
// (pending/confirmed/preparing/on_the_way/completed/cancelled — defined in
// src/lib/database.types.ts). No new statuses are introduced here; this
// only maps the ones that already exist to short SMS copy.

const LABELS: Record<string, string> = {
  pending: "Received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "Out for delivery",
  completed: "Delivered",
  cancelled: "Cancelled",
};

export function statusFriendlyLabel(status: string): string {
  return LABELS[status] || status;
}

export function buildStatusChangeMessage(ref: string, status: string, totalAmountKes: string): string {
  const label = statusFriendlyLabel(status);
  switch (status) {
    case "confirmed":
      return `Munchiz: Order #${ref} confirmed. Total KES ${totalAmountKes}. We're on it!`;
    case "preparing":
      return `Munchiz: Order #${ref} is being prepared.`;
    case "on_the_way":
      return `Munchiz: Order #${ref} is out for delivery.`;
    case "completed":
      return `Munchiz: Order #${ref} delivered. Thanks for ordering with us!`;
    case "cancelled":
      return `Munchiz: Order #${ref} has been cancelled.`;
    default:
      return `Munchiz: Order #${ref} is now ${label.toLowerCase()}.`;
  }
}
