export const P = {
  userManage: "user.manage",
  auditRead: "audit.read",
  productRead: "product.read",
  productWrite: "product.write",
  planWrite: "plan.write",
  keyRead: "key.read",
  keyIssue: "key.issue",
  keyRevoke: "key.revoke",
  customerRead: "customer.read",
  customerWrite: "customer.write",
  paymentRead: "payment.read",
  paymentWrite: "payment.write",
  mailRead: "mail.read",
  mailWrite: "mail.write",
  telemetryRead: "telemetry.read",
  supportRead: "support.read",
  supportWrite: "support.write",
  invoiceRead: "invoice.read",
  invoiceWrite: "invoice.write",
  analyticsRead: "analytics.read",
} as const

export type Permission = (typeof P)[keyof typeof P]

export function has(permissions: readonly string[] | undefined, code: Permission) {
  return !!permissions?.includes(code)
}
