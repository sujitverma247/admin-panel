import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeftIcon, LockIcon, RotateCcwIcon, SendIcon } from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, TableScroll } from "@/components/TableScroll"
import {
  closeTicket,
  getTicket,
  reopenTicket,
  replyTicket,
  ticketPriorityLabel,
  ticketStatusLabel,
  ticketTone,
  toTicketActionError,
  type TicketDetail,
} from "@/lib/api/support"
import { formatCount } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const BODY_MAX = 8000

export function TicketDetailPage() {
  const { id } = useParams()
  const ticketId = Number(id)
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.supportWrite)
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [reply, setReply] = useState("")
  const [replyPending, setReplyPending] = useState(false)
  const [confirm, setConfirm] = useState<"close" | "reopen" | null>(null)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    if (!token || !Number.isInteger(ticketId) || ticketId <= 0) return
    const ac = new AbortController()
    setLoading(true)
    getTicket(token, ticketId, ac.signal)
      .then((body) => {
        setTicket(body.ticket)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setTicket(null)
        setError("Unable to load this ticket.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, ticketId, reload])

  async function sendReply() {
    if (!token || !ticket) return
    const body = reply.trim()
    if (!body) {
      toast.error("Enter a reply before sending.")
      return
    }
    setReplyPending(true)
    try {
      const next = await replyTicket(token, ticket.id, body)
      setTicket(next.ticket)
      setReply("")
      toast.success("Reply sent")
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toTicketActionError(err, "reply"))
    } finally {
      setReplyPending(false)
    }
  }

  async function applyClose() {
    if (!token || !ticket) return
    setActionPending(true)
    try {
      const next = await closeTicket(token, ticket.id)
      setTicket(next.ticket)
      toast.success("Ticket closed")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toTicketActionError(err, "close"))
    } finally {
      setActionPending(false)
    }
  }

  async function applyReopen() {
    if (!token || !ticket) return
    setActionPending(true)
    try {
      const next = await reopenTicket(token, ticket.id)
      setTicket(next.ticket)
      toast.success("Ticket reopened")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toTicketActionError(err, "reopen"))
    } finally {
      setActionPending(false)
    }
  }

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return (
      <div className="p-6 text-sm text-[#8b93a7]">
        Invalid ticket.{" "}
        <Link to="/tickets" className="text-[#3b6cff] hover:underline">
          Back to tickets
        </Link>
      </div>
    )
  }

  const closed = ticket?.status === "closed"
  const messages = ticket?.messages ?? []

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/tickets" className="inline-flex items-center gap-1 text-sm text-[#3b6cff] hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            Support Tickets
          </Link>
          <h1 className="mt-2 text-[1.35rem] leading-none font-semibold tracking-tight wrap-break-word text-[#0f1f3d]">
            {ticket?.subject || (loading ? "Loading…" : "Ticket")}
          </h1>
          {ticket ? (
            <p className="mt-1.5 text-sm text-[#8b93a7]">
              {ticketPriorityLabel(ticket.priority)} · updated {formatStamp(ticket.updatedAt)}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-[#8b93a7]">{loading ? "Loading…" : "Not found"}</p>
          )}
        </div>
        {ticket && canWrite ? (
          <div className="flex flex-wrap gap-2">
            {closed ? (
              <button
                type="button"
                onClick={() => setConfirm("reopen")}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
              >
                <RotateCcwIcon className="size-4" />
                Reopen
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirm("close")}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#e8edf5] bg-white px-4 text-sm font-medium text-[#0f1f3d] hover:bg-[#f4f6fb]"
              >
                <LockIcon className="size-4" />
                Close
              </button>
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      {ticket ? (
        <TableScroll>
          <div className="min-w-0 space-y-4 pb-2">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card label="Status">
                <StatusBadge tone={ticketTone(ticket.status)}>{ticketStatusLabel(ticket.status)}</StatusBadge>
              </Card>
              <Card label="Priority">
                <p className="font-medium text-[#0f1f3d]">{ticketPriorityLabel(ticket.priority)}</p>
              </Card>
              <Card label="Messages">
                <p className="text-lg font-semibold text-[#0f1f3d]">{formatCount(messages.length)}</p>
              </Card>
              <Card label="Ticket ID">
                <CopyableText value={ticket.publicId} label="ticket id" className="font-mono text-xs text-[#0f1f3d]" />
              </Card>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Your information</h2>
                <p className="mt-1 text-xs text-[#8b93a7]">Details the customer submitted on the website form.</p>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Name">
                    {ticket.customerId ? (
                      <Link to={`/customers/${ticket.customerId}`} className="wrap-break-word text-[#3b6cff] hover:underline">
                        {ticket.customerName || "Customer"}
                      </Link>
                    ) : (
                      ticket.customerName || "—"
                    )}
                  </Row>
                  <Row label="Email">
                    <CopyableText value={ticket.customerEmail} label="email" className="text-[#0f1f3d]" />
                  </Row>
                  <Row label="Phone">
                    <CopyableText value={ticket.phone} label="phone" className="text-[#0f1f3d]" />
                  </Row>
                  <Row label="Street">{ticket.street || "—"}</Row>
                  <Row label="Country">{ticket.country || "—"}</Row>
                  <Row label="State">{ticket.region || "—"}</Row>
                  <Row label="City">{ticket.city || "—"}</Row>
                  <Row label="Postal / ZIP">{ticket.postalCode || "—"}</Row>
                  {!ticket.street && !ticket.city && !ticket.region && !ticket.postalCode && !ticket.country ? (
                    <Row label="Address">{ticket.address || "—"}</Row>
                  ) : null}
                </dl>
              </section>

              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Origin</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Website">
                    {ticket.websiteUrl ? (
                      <a
                        href={ticket.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="wrap-break-word text-[#3b6cff] hover:underline"
                      >
                        {ticket.websiteName || ticket.websiteUrl}
                      </a>
                    ) : (
                      ticket.websiteName || "—"
                    )}
                  </Row>
                  <Row label="Product">
                    {ticket.productId ? (
                      <Link to="/products" className="wrap-break-word text-[#3b6cff] hover:underline">
                        {ticket.productName || "Product"}
                      </Link>
                    ) : (
                      ticket.productName || "—"
                    )}
                  </Row>
                  <Row label="License">
                    {ticket.licenseKey ? (
                      <CopyableText value={ticket.licenseKey} label="license key" className="font-mono text-xs text-[#0f1f3d]" />
                    ) : (
                      "—"
                    )}
                  </Row>
                </dl>
              </section>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Session</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="IP">
                    <CopyableText value={ticket.ip} label="ip" className="font-mono text-xs text-[#0f1f3d]" />
                  </Row>
                  <Row label="Device">{ticket.device || "—"}</Row>
                  <Row label="Language">{ticket.language || "—"}</Row>
                  <Row label="Timezone">{ticket.timezone || "—"}</Row>
                  <Row label="Screen">{ticket.screen || "—"}</Row>
                  <Row label="Geo">{ticket.geo || "—"}</Row>
                  <Row label="ISP">{ticket.isp || "—"}</Row>
                </dl>
              </section>

              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Mail</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Mail">{mailLabel(ticket.mail)}</Row>
                  <Row label="Admin emailed">{ticket.adminEmailedAt ? formatFullStamp(ticket.adminEmailedAt) : "—"}</Row>
                  <Row label="Customer emailed">{ticket.customerEmailedAt ? formatFullStamp(ticket.customerEmailedAt) : "—"}</Row>
                </dl>
              </section>
            </div>

            <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Issue</h2>
              <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-[#0f1f3d]">
                {ticket.issue || "—"}
              </p>
            </section>

            <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Conversation</h2>
              <div className="mt-3 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-[#8b93a7]">No messages yet.</p>
                ) : (
                  messages.map((message) => {
                    const staff = message.author === "staff"
                    return (
                      <div
                        key={message.id}
                        className={cn("flex", staff ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[40rem] min-w-0 rounded-2xl px-4 py-3",
                            staff ? "bg-[#3b6cff] text-white" : "bg-[#f4f6fb] text-[#0f1f3d]",
                          )}
                        >
                          <p className={cn("text-xs", staff ? "text-white/80" : "text-[#8b93a7]")}>
                            {message.authorName || (staff ? "Staff" : "Customer")} · {formatStamp(message.createdAt)}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">{message.body}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            {canWrite && !closed ? (
              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Reply</h2>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value.slice(0, BODY_MAX))}
                  rows={5}
                  placeholder="Write a reply to the customer…"
                  className="mt-3 w-full resize-y rounded-xl border border-[#e8edf5] px-3 py-2 text-sm text-[#0f1f3d] outline-none focus-visible:border-[#3b6cff] focus-visible:ring-3 focus-visible:ring-[#3b6cff]/20"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[12px] text-[#8b93a7]">
                    {formatCount(reply.length)} / {formatCount(BODY_MAX)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void sendReply()}
                    disabled={replyPending || reply.trim().length === 0}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0] disabled:opacity-60"
                  >
                    <SendIcon className="size-4" />
                    {replyPending ? "Sending…" : "Send reply"}
                  </button>
                </div>
              </section>
            ) : null}

            {canWrite && closed ? (
              <p className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3 text-sm text-[#8b93a7]">
                This ticket is closed. Reopen it to send another reply.
              </p>
            ) : null}
          </div>
        </TableScroll>
      ) : null}

      {confirm === "close" && ticket ? (
        <ConfirmDialog
          title="Close ticket"
          description={`Close “${ticket.subject}”? The customer will not be able to reply until it is reopened.`}
          confirmLabel="Close"
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(null)
          }}
          onConfirm={() => void applyClose()}
        />
      ) : null}

      {confirm === "reopen" && ticket ? (
        <ConfirmDialog
          title="Reopen ticket"
          description={`Reopen “${ticket.subject}” so you can reply again?`}
          confirmLabel="Reopen"
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(null)
          }}
          onConfirm={() => void applyReopen()}
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

function mailLabel(value: string) {
  if (value === "sent") return "Sent"
  if (value === "pending") return "Pending"
  return value || "—"
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

function formatFullStamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })
}
