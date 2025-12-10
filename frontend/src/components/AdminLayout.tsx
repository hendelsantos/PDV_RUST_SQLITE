import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    LogOut,
    CreditCard,
    Users
} from "lucide-react";

const navItems = [
    { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/admin/plans", label: "Planos", icon: CreditCard },
    { href: "/admin/tenants", label: "Clientes", icon: Users },
    { href: "/admin/resellers", label: "Revendedores", icon: Users },
];

export default function AdminLayout() {
    const logout = useAuthStore((state) => state.logout);
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-gray-900 text-white border-r border-gray-800 flex flex-col shadow-xl">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Super Admin
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">SaaS Management</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link key={item.href} to={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={`w-full justify-start gap-3 mb-1 ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-gray-800" onClick={logout}>
                        <LogOut className="h-5 w-5" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
