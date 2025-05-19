// src/app/account/orders/page.tsx
import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerActionClient } from "~/trpc/server";
import { auth } from "~/server/auth"; // NextAuth.js v5 auth function
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge"; // Assuming Badge UI component
import { formatCurrency, formatDate } from "~/utils/format";
import { FaBoxOpen, FaExternalLinkAlt } from "react-icons/fa";

export const metadata: Metadata = {
  title: "My Orders - The Scent",
  description: "View your order history, track shipments, and manage your purchases.",
};

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/account/orders");
  }

  const serverApi = await createServerActionClient();
  // Fetch user's orders - assuming ordersRouter.getUserOrders exists
  const ordersData = await serverApi.orders.getUserOrders.query({ limit: 10 }); // Example limit

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">My Orders</h1>

      {ordersData.orders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg bg-card">
          <FaBoxOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Orders Yet</h2>
          <p className="text-muted-foreground mb-6">You haven't placed any orders with us yet. Start exploring our collection!</p>
          <Button asChild>
            <Link href="/products">Shop Now</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersData.orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 bg-muted/50 dark:bg-card-foreground/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Order #{order.orderNumber}</h2>
                  <p className="text-sm text-muted-foreground">
                    Placed on: {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={
                        order.status === "DELIVERED" || order.status === "COMPLETED" ? "success" :
                        order.status === "SHIPPED" || order.status === "IN_TRANSIT" ? "default" :
                        order.status === "CANCELLED" || order.status === "FAILED" ? "destructive" :
                        "secondary"
                    }>
                        {order.status.toString().replace(/_/g, ' ').toLocaleUpperCase()}
                    </Badge>
                    <span className="text-lg font-semibold text-foreground">{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {/* Display a few items or summary */}
                {order.orderItems.slice(0, 2).map(item => (
                    <div key={item.id} className="flex items-center gap-4 py-2 border-b border-border last:border-b-0">
                        {item.imageUrl && <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded object-cover h-12 w-12"/>}
                        <div className="flex-grow">
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm text-foreground">{formatCurrency(item.price * item.quantity, order.currency)}</p>
                    </div>
                ))}
                {order.orderItems.length > 2 && <p className="text-xs text-muted-foreground mt-2">...and {order.orderItems.length - 2} more items</p>}
              </div>
              <div className="p-4 sm:p-6 border-t border-border bg-muted/30 dark:bg-card-foreground/5 flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/account/orders/${order.id}`}>
                    View Details <FaExternalLinkAlt className="ml-2 h-3 w-3"/>
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {/* TODO: Pagination for orders */}
        </div>
      )}
    </div>
  );
}