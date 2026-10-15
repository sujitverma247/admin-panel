import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeftIcon, CircleDollarSignIcon } from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame } from "@/components/TableScroll"
import { API_BASE } from "@/lib/api/client"
import {
  getOrder,
  markOrderPaid,
  toOrderActionError,
  type OrderDetail,
} from "@/lib/api/payments"
import { formatMoney, titleStatus } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { statusTone } from "@/pages/payments/OrdersListPage"

export function OrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.paymentWrite)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [confirm, setConfirm] = useState<"paid" | null>(null)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    if (!token || !Number.isInteger(orderId) || orderId <= 0) return
    const ac = new AbortController()
    setLoading(true)
    getOrder(token, orderId, ac.signal)
      .then((body) => {
        setOrder(body.order)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setOrder(null)
        setError("Unable to load this order.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, orderId, reload])

  async function applyPaid() {
    if (!token || !order) return
    setActionPending(true)
    try {
      const body = await markOrderPaid(token, order.id)
      setOrder(body.order)
      toast.success("Order marked paid")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toOrderActionError(err))
    } finally {
      setActionPending(false)
    }
  }

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return (
      <div className="p-6 text-sm text-[#8b93a7]">
        Invalid order.{" "}
        <Link to="/orders" className="text-[#3b6cff] hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-[#3b6cff] hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            Orders
          </Link>
          <h1 className="mt-2 font-mono text-[1.35rem] leading-none font-semibold tracking-tight break-all text-[#0f1f3d]">
            {order?.publicId || (loading ? "Loading…" : "Order")}
          </h1>
          {order ? (
            <p className="mt-1.5 text-sm text-[#8b93a7]">
              {formatLabel(order.gateway)} · {order.planType} · created {formatStamp(order.createdAt)}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-[#8b93a7]">{loading ? "Loading…" : "Not found"}</p>
          )}
        </div>
        {canWrite && order ? (
          <div className="flex flex-wrap gap-2">
            {order.status === "pending" ? (
              <button
                type="button"
                onClick={() => setConfirm("paid")}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
              >
                <CircleDollarSignIcon className="size-4" />
                Mark Paid
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      {order ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card label="Status">
              <StatusBadge tone={statusTone(order.status)}>{titleStatus(order.status)}</StatusBadge>
            </Card>
            <Card label="Amount">
              <p className="text-lg font-semibold text-[#0f1f3d]">{formatMoney(order.amount, order.currency)}</p>
            </Card>
            <Card label="Product">
              <p className="font-medium text-[#0f1f3d]">{order.productName || "—"}</p>
              <p className="mt-0.5 text-xs text-[#8b93a7]">{order.planType}</p>
            </Card>
            <Card label="Paid at">
              <p className="text-sm text-[#0f1f3d]">{order.paidAt ? formatStamp(order.paidAt) : "—"}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Customer</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <Row label="Name">
                  {order.customerId ? (
                    <Link to={`/customers/${order.customerId}`} className="font-medium text-[#3b6cff] hover:underline">
                      {order.customerName || order.customerEmail || "Customer"}
                    </Link>
                  ) : (
                    order.customerName || "—"
                  )}
                </Row>
                <Row label="Email">
                  <CopyableText value={order.customerEmail} label="email" className="font-medium text-[#0f1f3d]" />
                </Row>
                <Row label="Phone">
                  <CopyableText value={order.customerPhone} label="phone" className="text-[#0f1f3d]" />
                </Row>
              </dl>
            </section>

            <section className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Payment</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <Row label="Order ID">
                  <CopyableText value={order.publicId} label="order id" className="font-mono text-[#0f1f3d]" />
                </Row>
                <Row label="Gateway">{formatLabel(order.gateway)}</Row>
                <Row label="External payment">
                  <CopyableText value={order.externalPaymentId} label="payment id" className="font-mono text-[#0f1f3d]" />
                </Row>
                <Row label="Checkout">
                  {order.checkoutUrl ? (
                    <a
                      href={checkoutHref(order.checkoutUrl)}
                      className="break-all text-[#3b6cff] hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {order.checkoutUrl}
                    </a>
                  ) : (
                    "—"
                  )}
                </Row>
              </dl>
            </section>
          </div>

          <section className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
            <h2 className="text-sm font-semibold text-[#0f1f3d]">License</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Row label="Key">
                <CopyableText value={order.licenseKey} label="key" className="font-mono text-[#0f1f3d]" />
              </Row>
              <Row label="License ID">{order.licenseId ?? "—"}</Row>
            </dl>
          </section>
        </div>
      ) : null}

      {confirm === "paid" && order ? (
        <ConfirmDialog
          title="Mark order paid"
          description={`Mark order ${order.publicId} as paid? This issues a license key if one is not already attached.`}
          confirmLabel="Mark Paid"
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(null)
          }}
          onConfirm={() => void applyPaid()}
        />
      ) : null}
    </ListPageFrame>
  )
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
      <p className="text-xs text-[#8b93a7]">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-[#8b93a7]">{label}</dt>
      <dd className="min-w-0 text-right text-[#0f1f3d]">{children}</dd>
    </div>
  )
}

function checkoutHref(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`
}

function formatLabel(value: string) {
  if (!value) return "—"
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatStamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${datePart} ${hh}:${mm}`
}
