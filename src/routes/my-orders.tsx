import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/lib/database.types";

export const Route = createFileRoute("/my-orders")({
  component: MyOrders,
});

function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/sign-in", search: { returnTo: "/my-orders" } });
    }
  }, [authLoading, user, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-orders-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => {}
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-display text-secondary">My Orders</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 animate-pulse border border-border">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-semibold">No orders yet</p>
            <Link
              to="/"
              className="mt-4 inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold uppercase text-sm hover:bg-secondary transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const items = (order.items_summary as Array<{ name: string; quantity: number; unit_price: number; subtotal: number }>) || [];
              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                        {" · "}
                        {items.length} item{items.length !== 1 ? "s" : ""}
                        {" · "}
                        <span className="font-semibold text-secondary">KES {order.total_amount.toLocaleString()}</span>
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                            <span className="font-semibold">KES {item.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-2 space-y-1 text-sm">
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery fee</span>
                            <span>KES {order.delivery_fee.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-primary">KES {order.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2">
                        <div>
                          {order.order_type === "pickup" ? "🏬 " : "🚚 "}
                          <span className="capitalize font-medium text-secondary">{order.order_type}</span>
                          {order.order_type === "pickup" && order.pickup_branch_name && (
                            <span className="text-muted-foreground"> — {order.pickup_branch_name}</span>
                          )}
                          {order.order_type === "delivery" && order.zone_name && (
                            <span className="text-muted-foreground"> — {order.zone_name}</span>
                          )}
                        </div>
                        <div>Payment: <span className="capitalize font-medium text-secondary">{order.payment_method}</span></div>
                        {order.delivery_address && <div className="col-span-2">Address: {order.delivery_address}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    on_the_way: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    on_the_way: "On The Way",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  );
}
