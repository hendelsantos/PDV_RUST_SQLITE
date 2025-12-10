import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import { useAuthStore } from "@/store/auth"

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  return token ? <Outlet /> : <Navigate to="/login" />
}

import Layout from "@/components/Layout"
import Products from "@/pages/Products"
import POS from "@/pages/POS"
import Sales from "@/pages/Sales"

import Dashboard from "@/pages/Dashboard"

import BackofficeLayout from "@/components/BackofficeLayout"
import AdminDashboard from "@/pages/admin/Dashboard"
import Plans from "@/pages/admin/Plans"
import Tenants from "@/pages/admin/Tenants"
import Resellers from "@/pages/admin/Resellers"
import Customers from "@/pages/Customers"
import Users from "@/pages/admin/Users"
import ResellerDashboard from "@/pages/reseller/Dashboard"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          {/* App (Operation) Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/sales" element={<Sales />} />
          </Route>

          {/* Backoffice (Management) Layout */}
          <Route element={<BackofficeLayout />}>
            {/* Master Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/plans" element={<Plans />} />
            <Route path="/admin/tenants" element={<Tenants />} />
            <Route path="/admin/tenants" element={<Tenants />} />
            <Route path="/admin/resellers" element={<Resellers />} />
            <Route path="/admin/users" element={<Users />} />

            {/* Reseller Routes */}
            <Route path="/reseller/dashboard" element={<ResellerDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
