import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeftIcon, BanIcon, FileDownIcon } from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, TableScroll } from "@/components/TableScroll"
import {
  downloadInvoicePdf,
  getInvoice,
  invoiceStatusLabel,
  invoiceTone,
  toInvoiceActionError,
  voidInvoice,
  type InvoiceDetail,
} from "@/lib/api/invoices"
import { formatMoney } from "@/lib/format"
import { has, P } from "@/lib/permissions"

export function InvoiceDetailPage() {
  const { id } = useParams()
  const invoiceId = Number(id)
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.invoiceWrite)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [pdfPending, setPdfPending] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    if (!token || !Number.isInteger(invoiceId) || invoiceId <= 0) return
    const ac = new AbortController()
    setLoading(true)
    getInvoice(token, invoiceId, ac.signal)
      .then((body) => {
        setInvoice(body.invoice)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setInvoice(null)
        setError("Unable to load this invoice.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, invoiceId, reload])

  async function downloadPdf() {
    if (!token || !invoice || pdfPending) return
    setPdfPending(true)
    try {
      await downloadInvoicePdf(token, invoice.id, invoice.number)
      toast.success("Invoice PDF downloaded")
    } catch (err) {
      toast.error(toInvoiceActionError(err, "pdf"))
    } finally {
      setPdfPending(false)
    }
  }

  async function applyVoid() {
    if (!token || !invoice) return
    setActionPending(true)
    try {
      const body = await voidInvoice(token, invoice.id)
      setInvoice(body.detail)
      toast.success("Invoice cancelled")
      setConfirm(false)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toInvoiceActionError(err, "void"))
    } finally {
      setActionPending(false)
    }
  }

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return (
      <div className="p-6 text-sm text-[#8b93a7]">
        Invalid invoice.{" "}
        <Link to="/invoices" className="text-[#3b6cff] hover:underline">
          Back to invoices
        </Link>
      </div>
    )
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/invoices" className="inline-flex items-center gap-1 text-sm text-[#3b6cff] hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            Invoices
          </Link>
          <h1 className="mt-2 font-mono text-[1.35rem] leading-none font-semibold tracking-tight break-all text-[#0f1f3d]">
            {invoice?.number || (loading ? "Loading…" : "Invoice")}
          </h1>
          {invoice ? (
            <p className="mt-1.5 text-sm text-[#8b93a7]">
              {formatLabel(invoice.gateway)} · {invoice.planType} · issued {formatStamp(invoice.issuedAt)}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-[#8b93a7]">{loading ? "Loading…" : "Not found"}</p>
          )}
        </div>
        {invoice ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={pdfPending}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0] disabled:opacity-60"
            >
              <FileDownIcon className="size-4" />
              {pdfPending ? "Preparing…" : "Download PDF"}
            </button>
            {canWrite && invoice.status === "issued" ? (
              <button
                type="button"
                onClick={() => setConfirm(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#fecaca] bg-white px-4 text-sm font-medium text-[#dc2626] hover:bg-[#fef2f2]"
              >
                <BanIcon className="size-4" />
                Cancel invoice
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      {invoice ? (
        <TableScroll>
          <div className="min-w-0 space-y-4 pb-2">
            {invoice.status === "void" ? (
              <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm wrap-break-word text-[#b91c1c]">
                This invoice is cancelled. It is kept as a record of the original payment and is not a bill.
                Refunds are processed on the payment gateway.
              </p>
            ) : null}
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card label="Status">
                <StatusBadge tone={invoiceTone(invoice.status)}>{invoiceStatusLabel(invoice.status)}</StatusBadge>
              </Card>
              <Card label="Amount">
                <p className="text-lg font-semibold text-[#0f1f3d]">{formatMoney(invoice.amount, invoice.currency)}</p>
              </Card>
              <Card label="Product">
                <p className="min-w-0 wrap-break-word font-medium text-[#0f1f3d]">{invoice.productName || "—"}</p>
                <p className="mt-0.5 text-xs text-[#8b93a7]">{invoice.planType}</p>
              </Card>
              <Card label="Cancelled at">
                <p className="text-sm text-[#0f1f3d]">{invoice.voidedAt ? formatStamp(invoice.voidedAt) : "—"}</p>
              </Card>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Customer</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Name">
                    {invoice.customerId ? (
                      <Link to={`/customers/${invoice.customerId}`} className="wrap-break-word text-[#3b6cff] hover:underline">
                        {invoice.customerName || "Customer"}
                      </Link>
                    ) : (
                      invoice.customerName || "—"
                    )}
                  </Row>
                  <Row label="Email">
                    <CopyableText value={invoice.customerEmail} label="email" className="text-[#0f1f3d]" />
                  </Row>
                </dl>
              </section>

              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Invoice</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Number">
                    <CopyableText value={invoice.number} label="invoice number" className="font-mono text-[#0f1f3d]" />
                  </Row>
                  <Row label="Seller">{invoice.brandName || "—"}</Row>
                  <Row label="Support">
                    <CopyableText value={invoice.supportEmail} label="support email" className="text-[#0f1f3d]" />
                  </Row>
                  <Row label="Policy">{invoice.policyVersion || "—"}</Row>
                  <div className="space-y-1">
                    <dt className="text-[#8b93a7]">PDF hash</dt>
                    <dd>
                      <CopyableText value={invoice.pdfSha256} label="pdf hash" className="font-mono text-xs text-[#0f1f3d]" />
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Order</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <Row label="Order">
                  {invoice.orderId ? (
                    <Link to={`/orders/${invoice.orderId}`} className="font-mono break-all text-[#3b6cff] hover:underline">
                      {invoice.orderPublicId}
                    </Link>
                  ) : (
                    <CopyableText value={invoice.orderPublicId} label="order id" className="font-mono text-[#0f1f3d]" />
                  )}
                </Row>
                <Row label="Gateway">{formatLabel(invoice.gateway)}</Row>
              </dl>
            </section>
          </div>
        </TableScroll>
      ) : null}

      {confirm && invoice ? (
        <ConfirmDialog
          title="Cancel invoice"
          description={`Cancel ${invoice.number}? Cancelled means this document is no longer a bill. It does not refund the payment — refunds happen on the gateway.`}
          confirmLabel="Cancel Invoice"
          danger
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(false)
          }}
          onConfirm={() => void applyVoid()}
        />
      ) : null}
    </ListPageFrame>
  )
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
      <p className="text-xs text-[#8b93a7]">{label}</p>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <dt className="shrink-0 text-[#8b93a7]">{label}</dt>
      <dd className="min-w-0 wrap-break-word text-right text-[#0f1f3d]">{children}</dd>
    </div>
  )
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
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
