import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeftIcon, SendIcon } from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, TableScroll } from "@/components/TableScroll"
import {
  getMail,
  mailLocaleLabel,
  mailStatusLabel,
  mailTemplateLabel,
  mailTone,
  resendMail,
  toMailActionError,
  type MailDetail,
} from "@/lib/api/mail"
import { formatCount } from "@/lib/format"
import { has, P } from "@/lib/permissions"

export function MailDetailPage() {
  const { id } = useParams()
  const mailId = Number(id)
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.mailWrite)
  const [mail, setMail] = useState<MailDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    if (!token || !Number.isInteger(mailId) || mailId <= 0) return
    const ac = new AbortController()
    setLoading(true)
    getMail(token, mailId, ac.signal)
      .then((body) => {
        setMail(body.mail)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setMail(null)
        setError("Unable to load this message.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, mailId, reload])

  async function applyResend() {
    if (!token || !mail) return
    setActionPending(true)
    try {
      const body = await resendMail(token, mail.id)
      setMail(body.mail)
      toast.success("Message queued to send again")
      setConfirm(false)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toMailActionError(err, "resend"))
    } finally {
      setActionPending(false)
    }
  }

  if (!Number.isInteger(mailId) || mailId <= 0) {
    return (
      <div className="p-6 text-sm text-[#8b93a7]">
        Invalid message.{" "}
        <Link to="/mail" className="text-[#3b6cff] hover:underline">
          Back to mail
        </Link>
      </div>
    )
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/mail" className="inline-flex items-center gap-1 text-sm text-[#3b6cff] hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            Mail Outbox
          </Link>
          <h1 className="mt-2 text-[1.35rem] leading-none font-semibold tracking-tight wrap-break-word text-[#0f1f3d]">
            {mail?.subject || (loading ? "Loading…" : "Message")}
          </h1>
          {mail ? (
            <p className="mt-1.5 text-sm text-[#8b93a7]">
              {mailTemplateLabel(mail.template)} · created {formatStamp(mail.createdAt)}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-[#8b93a7]">{loading ? "Loading…" : "Not found"}</p>
          )}
        </div>
        {mail && canWrite ? (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
          >
            <SendIcon className="size-4" />
            Resend
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      {mail ? (
        <TableScroll>
          <div className="min-w-0 space-y-4 pb-2">
            {mail.status === "failed" && mail.lastError ? (
              <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm wrap-break-word text-[#b91c1c]">
                {mail.lastError}
              </p>
            ) : null}

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card label="Status">
                <StatusBadge tone={mailTone(mail.status)}>{mailStatusLabel(mail.status)}</StatusBadge>
              </Card>
              <Card label="Template">
                <p className="min-w-0 wrap-break-word font-medium text-[#0f1f3d]">{mailTemplateLabel(mail.template)}</p>
                <p className="mt-0.5 font-mono text-xs text-[#8b93a7]">{mail.template}</p>
              </Card>
              <Card label="Attempts">
                <p className="text-lg font-semibold text-[#0f1f3d]">{formatCount(mail.attempts)}</p>
              </Card>
              <Card label="Sent at">
                <p className="text-sm text-[#0f1f3d]">{mail.sentAt ? formatStamp(mail.sentAt) : "—"}</p>
              </Card>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">To</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Name">
                    {mail.customerId ? (
                      <Link to={`/customers/${mail.customerId}`} className="wrap-break-word text-[#3b6cff] hover:underline">
                        {mail.toName || "Customer"}
                      </Link>
                    ) : (
                      mail.toName || "—"
                    )}
                  </Row>
                  <Row label="Email">
                    <CopyableText value={mail.toEmail} label="email" className="text-[#0f1f3d]" />
                  </Row>
                </dl>
              </section>

              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">From</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Name">{mail.fromName || "—"}</Row>
                  <Row label="Email">
                    <CopyableText value={mail.fromEmail} label="from email" className="text-[#0f1f3d]" />
                  </Row>
                </dl>
              </section>
            </div>

            <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Delivery</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <Row label="Language">{mailLocaleLabel(mail.locale)}</Row>
                <Row label="Provider">{mail.provider || "—"}</Row>
                <Row label="Message ID">
                  <CopyableText value={mail.providerMessageId} label="message id" className="font-mono text-xs text-[#0f1f3d]" />
                </Row>
                <Row label="Idempotency">
                  <CopyableText value={mail.idempotencyKey} label="idempotency key" className="font-mono text-xs text-[#0f1f3d]" />
                </Row>
                <Row label="Order">
                  {mail.orderId ? (
                    <Link to={`/orders/${mail.orderId}`} className="text-[#3b6cff] hover:underline">
                      #{mail.orderId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="License">{mail.licenseId ?? "—"}</Row>
              </dl>
            </section>

            <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Body</h2>
              <pre className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap wrap-break-word font-sans text-sm leading-relaxed text-[#0f1f3d]">
                {mail.body || "—"}
              </pre>
            </section>
          </div>
        </TableScroll>
      ) : null}

      {confirm && mail ? (
        <ConfirmDialog
          title="Resend message"
          description={`Queue this message to ${mail.toEmail} again?`}
          confirmLabel="Resend"
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(false)
          }}
          onConfirm={() => void applyResend()}
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
