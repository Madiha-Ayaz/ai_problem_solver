import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/routing/ProtectedRoute'
import AppBackground from './components/ui/AppBackground'
import { ROLES } from './config/tickets'
import Toaster from './components/ui/Toaster'

import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'

import CustomerDashboard from './pages/customer/CustomerDashboard'
import MyTickets from './pages/customer/MyTickets'
import CreateTicket from './pages/customer/CreateTicket'
import CustomerTicketDetails from './pages/customer/TicketDetails'
import CustomerProfile from './pages/customer/Profile'

import AgentDashboard from './pages/agent/AgentDashboard'
import AgentTickets from './pages/agent/Tickets'
import AgentTicketDetails from './pages/agent/TicketDetails'
import AgentProfile from './pages/agent/Profile'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTickets from './pages/admin/AdminTickets'
import AdminTicketDetails from './pages/admin/AdminTicketDetails'
import AdminUserTickets from './pages/admin/AdminUserTickets'
import AdminResolveSuggestions from './pages/admin/AdminResolveSuggestions'
import AdminNeon from './pages/admin/AdminNeon'


function PublicLayout() {
  return (
    <>
      <AppBackground />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster />
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/register" element={<AuthPage mode="signup" />} />
          <Route path="*" element={<HomePage />} />
        </Route>

        {/* Customer area — only customers (server-side enforced too). */}
        <Route
          element={
            <ProtectedRoute roles={[ROLES.CUSTOMER]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/tickets" element={<MyTickets />} />
          <Route path="/customer/tickets/new" element={<CreateTicket />} />
          <Route path="/customer/tickets/:ticketId" element={<CustomerTicketDetails />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
        </Route>

        {/* Agent area — only agents. */}
        <Route
          element={
            <ProtectedRoute roles={[ROLES.AGENT]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/agent/tickets" element={<AgentTickets />} />
          <Route path="/agent/tickets/:ticketId" element={<AgentTicketDetails />} />
          <Route path="/agent/profile" element={<AgentProfile />} />
        </Route>

        {/* Admin portal — only admins. Grants access to people management
            (customers + agents) and an overview of every ticket. */}
        <Route
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/customers" element={<AdminUsers role={ROLES.CUSTOMER} />} />
          <Route path="/admin/agents" element={<AdminUsers role={ROLES.AGENT} />} />
          <Route path="/admin/customers/:uid/tickets" element={<AdminUserTickets />} />
          <Route path="/admin/agents/:uid/tickets" element={<AdminUserTickets />} />
          <Route path="/admin/customer/tickets" element={<AdminTickets />} />
          <Route path="/admin/resolve/suggestions" element={<AdminResolveSuggestions />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/neon" element={<AdminNeon />} />
          <Route path="/admin/tickets/:ticketId" element={<AdminTicketDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}