// src/app/account/orders/[id]/page.tsx
import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerActionClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { formatCurrency, formatDate } from "~/utils/format";
import Image from "next/image";
import { FaArrowLeft, FaPrint } from "react-icons/fa";

interface OrderDetailPageProps {
  params: { id: string }; // Order ID from the URL
}

// Dynamic metadata based on the order
export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const session = await auth();
  if (!session?.user) return { title: "Order Details - Sign In Required" }; // Or handle redirect earlier

  const serverApi = await createServerActionClient();
  try {
    const order = await serverApi.orders.getOrderById.query({ id: params.id });
    if (!order || order.userId !== session.user.id) { // Ensure user owns the order
      return { title: "Order Not Found" };
    }
    return {
      title: `Order #${order.orderNumber} - The Scent`,
      description: `Details for your order #${order.orderNumber} placed on ${formatDate(order.createdAt)}.`,
    };
  } catch (error) {
    return { title: "Error Loading Order" };
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/account/orders/${params.id}`);
  }

  const serverApi = await createServerActionClient();
  let order;
  try {
    order = await serverApi.orders.getOrderById.query({ id: params.id });
  } catch (error) {
    console.error("Error fetching order details:", error);
    // Handle specific TRPC errors if needed, e.g., NOT_FOUND
    if ((error as any).code === 'NOT_FOUND') notFound();
    // For other errors, you might show a generic error message or redirect
    return <div className="container p-8 text-center text-destructive">Error loading order details.</div>;
  }

  if (!order || order.userId !== session.user.id) { // Final check for ownership
    notFound();
  }

  const shippingAddr = order.shippingAddress as { fullName: string, addressLine1: string, addressLine2?: string, city: string, state: string, zipCode: string, country: string, phone?:string };
  // const billingAddr = order.billingAddress as { ... } | null; // Similar type for billing if used

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
            <Link href="/account/orders" className="inline-flex items-center text-sm text-primary hover:underline mb-2">
                <FaArrowLeft className="mr-2 h-3 w-3" /> Back to Orders
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Order Details
            </h1>
            <p className="text-muted-foreground">Order #{order.orderNumber} &bull; Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => typeof window !== "undefined" && window.print()}>
            <FaPrint className="mr-2 h-4 w-4"/> Print Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card shadow-sm">
                <h2 className="text-xl font-semibold text-foreground p-4 sm:p-6 border-b border-border">Items Ordered ({order.orderItems.length})</h2>
                <ul role="list" className="divide-y divide-border">
                    {order.orderItems.map((item) => (
                    <li key={item.id} className="flex py-4 sm:py-6 px-4 sm:px-6">
                        {item.imageUrl && (
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border sm:h-24 sm:w-24">
                                <Image
                                src={item.imageUrl}
                                alt={item.name} // productData might have better alt
                                width={96}
                                height={96}
                                className="h-full w-full object-cover object-center"
                                />
                            </div>
                        )}
                        <div className="ml-4 flex flex-1 flex-col">
                        <div>
                            <div className="flex justify-between text-base font-medium text-foreground">
                            <h3>
                                <Link href={`/products/${(item.productData as any)?.slug || '#'}`}>{item.name}</Link>
                            </h3>
                            <p className="ml-4">{formatCurrency(item.price * item.quantity, order.currency)}</p>
                            </div>
                            {/* {(item.productData as any)?.variantName && <p className="mt-1 text-sm text-muted-foreground">{(item.productData as any).variantName}</p>} */}
                            <p className="mt-1 text-sm text-muted-foreground">Price: {formatCurrency(item.price, order.currency)}</p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                            <p className="text-muted-foreground">Qty: {item.quantity}</p>
                            {/* Add remove/actions if applicable and order is mutable */}
                        </div>
                        </div>
                    </li>
                    ))}
                </ul>
                 <div className="border-t border-border px-4 py-6 sm:px-6 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <p>Subtotal</p><p>{formatCurrency(order.subtotal, order.currency)}</p>
                    </div>
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                        <p>Discount</p><p className="text-green-600">-{formatCurrency(order.discountAmount, order.currency)}</p>
                        </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <p>Shipping</p><p>{formatCurrency(order.shippingCost, order.currency)}</p>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <p>Tax</p><p>{formatCurrency(order.tax, order.currency)}</p>
                    </div>
                    <div className="flex justify-between text-base font-medium text-foreground">
                        <p>Total</p><p>{formatCurrency(order.total, order.currency)}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Shipping & Status */}
        <div className="space-y-6 lg:sticky lg:top-24 self-start">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Order Status</h2>
                <Badge variant={
                    order.status === "DELIVERED" || order.status === "COMPLETED" ? "success" :
                    order.status === "SHIPPED" || order.status === "IN_TRANSIT" ? "default" :
                    order.status === "CANCELLED" || order.status === "FAILED" ? "destructive" :
                    "secondary"
                } className="text-sm px-3 py-1">
                    {order.status.toString().replace(/_/g, ' ').toLocaleUpperCase()}
                </Badge>
                {order.trackingNumber && (
                    <p className="mt-3 text-sm text-muted-foreground">
                        Tracking: <span className="text-primary font-medium">{order.trackingNumber}</span>
                        {/* TODO: Add link to tracking provider if possible */}
                    </p>
                )}
            </div>
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Shipping Address</h2>
                <address className="not-italic text-sm text-muted-foreground space-y-0.5">
                    <p className="font-medium text-foreground">{shippingAddr.fullName}</p>
                    <p>{shippingAddr.addressLine1}</p>
                    {shippingAddr.addressLine2 && <p>{shippingAddr.addressLine2}</p>}
                    <p>{shippingAddr.city}, {shippingAddr.state} {shippingAddr.zipCode}</p>
                    <p>{shippingAddr.country}</p>
                    {shippingAddr.phone && <p>Phone: {shippingAddr.phone}</p>}
                </address>
            </div>
            {/* Optional: Billing Address, Payment Method */}
        </div>
      </div>
    </div>
  );
}