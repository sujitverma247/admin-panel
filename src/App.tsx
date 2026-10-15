import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { ToastContainer } from "react-toastify"
import { AuthProvider } from "@/auth/AuthProvider"
import { RequireAuth } from "@/auth/RequireAuth"
import { RequirePermission } from "@/auth/RequirePermission"
import { AppShell } from "@/layout/AppShell"
import { P, type Permission } from "@/lib/permissions"
import { UsersPage } from "@/pages/admin/UsersPage"
import { AuditPage } from "@/pages/admin/AuditPage"
import { BrandsPage } from "@/pages/catalog/BrandsPage"
import { ProductsPage } from "@/pages/catalog/ProductsPage"
import { PlansPage } from "@/pages/catalog/PlansPage"
import { CustomerDetailPage } from "@/pages/customers/CustomerDetailPage"
import { CustomersListPage } from "@/pages/customers/CustomersListPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { InvoicesListPage } from "@/pages/invoices/InvoicesListPage"
import { KeysListPage } from "@/pages/keys/KeysListPage"
import { LoginPage } from "@/pages/login/LoginPage"
import { MailListPage } from "@/pages/mail/MailListPage"
import { OrdersListPage } from "@/pages/payments/OrdersListPage"
import { TicketsListPage } from "@/pages/support/TicketsListPage"
import { HeartbeatsPage } from "@/pages/telemetry/HeartbeatsPage"
import { MachinesPage } from "@/pages/telemetry/MachinesPage"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="brands" element={guard(P.productRead, <BrandsPage />)} />
            <Route path="products" element={guard(P.productRead, <ProductsPage />)} />
            <Route path="plans" element={guard(P.productRead, <PlansPage />)} />
            <Route path="keys" element={guard(P.keyRead, <KeysListPage />)} />
            <Route path="customers" element={guard(P.customerRead, <CustomersListPage />)} />
            <Route path="customers/:id" element={guard(P.customerRead, <CustomerDetailPage />)} />
            <Route path="orders" element={guard(P.paymentRead, <OrdersListPage />)} />
            <Route path="invoices" element={guard(P.invoiceRead, <InvoicesListPage />)} />
            <Route path="mail" element={guard(P.mailRead, <MailListPage />)} />
            <Route path="machines" element={guard(P.telemetryRead, <MachinesPage />)} />
            <Route path="heartbeats" element={guard(P.telemetryRead, <HeartbeatsPage />)} />
            <Route path="tickets" element={guard(P.supportRead, <TicketsListPage />)} />
            <Route path="users" element={guard(P.userManage, <UsersPage />)} />
            <Route path="audit" element={guard(P.auditRead, <AuditPage />)} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {createPortal(
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="light"
            style={{ zIndex: 100000 }}
          />,
          document.body,
        )}
      </AuthProvider>
    </BrowserRouter>
  )
}

function guard(code: Permission, page: ReactNode) {
  return <RequirePermission code={code}>{page}</RequirePermission>
}
