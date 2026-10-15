import type { LucideIcon } from "lucide-react"
import {
  ActivityIcon,
  ClipboardListIcon,
  CreditCardIcon,
  FileTextIcon,
  HeadphonesIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MailIcon,
  PackageIcon,
  TagIcon,
  UserCogIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { P, type Permission } from "@/lib/permissions"

export type NavChild = {
  to: string
  label: string
}

export type NavItem = {
  to?: string
  label: string
  icon: LucideIcon
  permission?: Permission
  children?: NavChild[]
  dividerBefore?: boolean
}

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/brands", label: "Brands", icon: TagIcon, permission: P.productRead },
  { to: "/products", label: "Products", icon: PackageIcon, permission: P.productRead },
  { to: "/plans", label: "Plans", icon: CreditCardIcon, permission: P.productRead },
  { to: "/keys", label: "License Keys", icon: KeyRoundIcon, permission: P.keyRead },
  { to: "/customers", label: "Customers", icon: UsersIcon, permission: P.customerRead },
  { to: "/orders", label: "Orders & Payments", icon: WalletIcon, permission: P.paymentRead },
  { to: "/invoices", label: "Invoices", icon: FileTextIcon, permission: P.invoiceRead },
  { to: "/mail", label: "Mail Outbox", icon: MailIcon, permission: P.mailRead },
  {
    label: "Telemetry",
    icon: ActivityIcon,
    permission: P.telemetryRead,
    children: [
      { to: "/machines", label: "Machines" },
      { to: "/heartbeats", label: "Heartbeats" },
    ],
  },
  { to: "/tickets", label: "Support Tickets", icon: HeadphonesIcon, permission: P.supportRead },
  { to: "/users", label: "Admin Users", icon: UserCogIcon, permission: P.userManage, dividerBefore: true },
  { to: "/audit", label: "Audit Log", icon: ClipboardListIcon, permission: P.auditRead },
]
