"use client"

import Link from "next/link"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { useAdminDashboard } from "@/services/admin/admin"
import { formatDate, formatPesewas } from "@/lib/utils"
import { AdminCard, AdminPageHeader, EmptyState, ErrorPanel, LoadingPanel, MetricCard, StatusBadge } from "@/components/admin/admin-ui"

export function AdminDashboardContent() {
  const query = useAdminDashboard()
  if (query.isLoading) return <LoadingPanel />
  if (query.isError || !query.data) return <ErrorPanel message={query.error?.message || "Dashboard could not be loaded"} retry={() => query.refetch()} />
  const data = query.data
  const orderChart = [
    { name: "Delivered", value: data.orderStatus.delivered, color: "#173f35" },
    { name: "Processing", value: data.orderStatus.processing, color: "#f8bd39" },
    { name: "Pending", value: data.orderStatus.pending, color: "#6b4423" },
    { name: "Refunded", value: data.orderStatus.refunded, color: "#ba1a1a" },
    { name: "Cancelled", value: data.orderStatus.cancelled, color: "#747878" },
  ].filter((item) => item.value > 0)

  return <>
    <AdminPageHeader title="Dashboard" description="A live view of store performance, fulfilment, and inventory health." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <MetricCard label="Verified Revenue" value={formatPesewas(data.summary.revenuePesewas, true)} icon="payments" change={data.changes.revenue} />
      <MetricCard label="Total Orders" value={data.summary.totalOrders.toLocaleString()} icon="shopping_bag" change={data.changes.orders} />
      <MetricCard label="Total Customers" value={data.summary.totalCustomers.toLocaleString()} icon="group" change={data.changes.customers} />
      <MetricCard label="Products in Stock" value={data.summary.productsInStock.toLocaleString()} icon="inventory_2" />
      <MetricCard label="Pending Orders" value={data.summary.pendingOrders.toLocaleString()} icon="pending_actions" />
      <MetricCard label="Low-Stock Products" value={data.summary.lowStockProducts.toLocaleString()} icon="warning" danger={data.summary.lowStockProducts > 0} />
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
      <AdminCard className="p-6"><div className="mb-5"><h2 className="font-heading text-xl font-semibold">Revenue Over Time</h2><p className="text-sm text-muted-foreground">Server-verified Paystack payments over the last 12 months</p></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthlyRevenue}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${Math.round(Number(value) / 10000)}k`} tickLine={false} axisLine={false} width={45} /><Tooltip formatter={(value) => formatPesewas(Number(value))} /><Bar dataKey="valuePesewas" fill="#221a0a" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div></AdminCard>
      <AdminCard className="p-6"><h2 className="font-heading text-xl font-semibold">Orders by Status</h2>{orderChart.length ? <><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={orderChart} innerRadius={58} outerRadius={82} dataKey="value" nameKey="name">{orderChart.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-2">{orderChart.map((item) => <div key={item.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="size-2.5" style={{ background: item.color }} />{item.name}</span><strong>{item.value}</strong></div>)}</div></> : <EmptyState icon="donut_large" title="No order activity" description="Order status distribution will appear after orders are placed." />}</AdminCard>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_2fr]">
      <AdminCard className="p-6"><h2 className="font-heading text-xl font-semibold">Sales by Category</h2><div className="mt-5 space-y-5">{data.salesByCategory.length ? data.salesByCategory.map((item) => { const max = data.salesByCategory[0]?.valuePesewas || 1; return <div key={item.name}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{item.name}</span><strong>{formatPesewas(item.valuePesewas, true)}</strong></div><div className="h-2 bg-surface-container"><div className="h-full bg-primary" style={{ width: `${Math.max(4, item.valuePesewas / max * 100)}%` }} /></div></div> }) : <p className="text-sm text-muted-foreground">No verified sales yet.</p>}</div></AdminCard>
      <AdminCard className="heritage-pattern p-6"><h2 className="font-heading text-xl font-semibold">Administrator Quick Actions</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button render={<Link href="/admin/products/new" />} className="justify-start"><MaterialSymbol icon="add_circle" />Add New Product</Button><Button render={<Link href="/admin/orders" />} variant="outline" className="justify-start"><MaterialSymbol icon="visibility" />View All Orders</Button><Button render={<Link href="/admin/discounts/new" />} variant="outline" className="justify-start"><MaterialSymbol icon="sell" />Create Discount</Button><Button render={<Link href="/admin/content" />} variant="outline" className="justify-start"><MaterialSymbol icon="image" />Update Homepage</Button></div>{data.summary.lowStockProducts > 0 && <div className="mt-6 flex gap-3 border border-error/20 bg-error-container p-4 text-sm text-error"><MaterialSymbol icon="campaign" /><span>Inventory notice: {data.summary.lowStockProducts} product{data.summary.lowStockProducts === 1 ? " is" : "s are"} at or below the configured stock threshold.</span></div>}</AdminCard>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
      <AdminCard><div className="flex items-center justify-between border-b border-outline-variant p-5"><h2 className="font-heading text-xl font-semibold">Recent Orders</h2><Link href="/admin/orders" className="text-sm underline">View All</Link></div>{data.recentOrders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-surface-container-low"><tr><th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Date</th><th className="p-4">Total</th><th className="p-4">Status</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id} className="border-t border-outline-variant"><td className="p-4"><Link href={`/admin/orders/${order.id}`} className="font-semibold underline">{order.orderNumber}</Link></td><td className="p-4">{order.customerName}</td><td className="p-4">{formatDate(order.createdAt)}</td><td className="p-4">{formatPesewas(order.totalPesewas)}</td><td className="p-4"><StatusBadge tone={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "warning"}>{order.status.replaceAll("_", " ")}</StatusBadge></td></tr>)}</tbody></table></div> : <EmptyState title="No orders yet" description="New customer orders will appear here." />}</AdminCard>
      <AdminCard><div className="flex items-center justify-between border-b border-outline-variant p-5"><h2 className="font-heading text-xl font-semibold text-error">Low-Stock Alert</h2><Link href="/admin/inventory?stock=low" className="text-sm text-error underline">Review Stock</Link></div>{data.lowStock.length ? <div>{data.lowStock.map((product) => <Link href={`/admin/products/${product.id}/edit`} key={product.id} className="flex items-center gap-3 border-b border-outline-variant p-4 hover:bg-surface-container-low"><div className="grid size-12 place-items-center bg-surface-container text-muted-foreground">{product.imageUrl ? <img src={product.imageUrl} alt="" className="size-full object-cover" /> : <MaterialSymbol icon="image" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">Threshold: {product.threshold}</p></div><strong className="text-sm text-error">{product.available} left</strong></Link>)}</div> : <EmptyState icon="check_circle" title="Inventory is healthy" description="No products are currently below their configured thresholds." />}</AdminCard>
    </div>
  </>
}
