export const kpis = [
  {
    key: "licenses",
    label: "Total Licenses",
    value: "1,248",
    delta: "+12%",
    hint: "vs previous 7 days",
    tone: "up" as const,
    iconBg: "bg-[#e8f0ff]",
    iconColor: "text-[#3b6cff]",
  },
  {
    key: "orders",
    label: "Paid Orders",
    value: "342",
    delta: "+18%",
    hint: "vs previous 7 days",
    tone: "up" as const,
    iconBg: "bg-[#e7f8ee]",
    iconColor: "text-[#22c55e]",
  },
  {
    key: "customers",
    label: "Customers",
    value: "518",
    delta: "+10%",
    hint: "vs previous 7 days",
    tone: "up" as const,
    iconBg: "bg-[#fef6e6]",
    iconColor: "text-[#eab308]",
  },
  {
    key: "tickets",
    label: "Open Tickets",
    value: "7",
    delta: "+3",
    hint: "vs previous 7 days",
    tone: "up" as const,
    iconBg: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
  },
  {
    key: "mail",
    label: "Pending Mails",
    value: "2",
    delta: "+1",
    hint: "vs previous 7 days",
    tone: "down" as const,
    iconBg: "bg-[#fde8e8]",
    iconColor: "text-[#ef4444]",
  },
]

export const chartLabels = ["Oct 8", "Oct 9", "Oct 10", "Oct 11", "Oct 12", "Oct 13", "Oct 14", "Oct 15"]

export const orderBars = [20, 26, 32, 24, 37, 44, 36, 30]

export const activationPoints = [14, 22, 30, 28, 36, 46, 38, 33]

export const recentOrders = [
  { id: "ORD-7F3A2C", customer: "john@example.com", amount: "$29.99", status: "Paid" as const, date: "Oct 15" },
  { id: "ORD-8B1D4E", customer: "sarah@example.com", amount: "$29.99", status: "Paid" as const, date: "Oct 14" },
  { id: "ORD-4C9F7A", customer: "mike@example.com", amount: "$49.99", status: "Paid" as const, date: "Oct 14" },
  { id: "ORD-2D7E1F", customer: "anna@example.com", amount: "$29.99", status: "Pending" as const, date: "Oct 13" },
  { id: "ORD-9A3B6C", customer: "robert@example.com", amount: "$29.99", status: "Paid" as const, date: "Oct 13" },
]

export const recentTickets = [
  { id: "TCK-4F9E2D", subject: "Activation issue", status: "Open" as const, date: "Oct 15" },
  { id: "TCK-1A3B7C", subject: "Refund request", status: "Waiting" as const, date: "Oct 14" },
  { id: "TCK-8E6D2F", subject: "License transfer", status: "Open" as const, date: "Oct 14" },
  { id: "TCK-5C7A9D", subject: "Payment question", status: "Waiting" as const, date: "Oct 13" },
  { id: "TCK-2E9F4B", subject: "Installation help", status: "Closed" as const, date: "Oct 12" },
]

export const systemStatus = [
  { label: "Database", icon: "database" as const },
  { label: "Payment Gateways", icon: "payments" as const },
  { label: "Mail Outbox", icon: "mail" as const },
  { label: "Telemetry", icon: "telemetry" as const },
  { label: "Support Tickets", icon: "support" as const },
  { label: "Invoices", icon: "invoices" as const },
]
