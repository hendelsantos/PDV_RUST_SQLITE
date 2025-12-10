import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    LogOut,
    CreditCard,
    Users,
    Store
} from "lucide-react";

export default function BackofficeLayout() {
    const logout = useAuthStore((state) => state.logout);
    const role = useAuthStore((state) => state.role);
    const location = useLocation();

    // Define menus based on role
    const adminItems = [
        { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
        { href: "/admin/plans", label: "Planos", icon: CreditCard },
        { href: "/admin/tenants", label: "Todas as Lojas", icon: Store },
        { href: "/admin/resellers", label: "Revendedores", icon: Users },
        { href: "/admin/users", label: "Usuários do Sistema", icon: Users },
    ];

    const resellerItems = [
        { href: "/reseller/dashboard", label: "Minhas Lojas", icon: Store },
        // Future: { href: "/reseller/financial", label: "Financeiro", icon: DollarSign },
    ];

    const navItems = role === 'admin' ? adminItems : resellerItems;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Backoffice Sidebar */}
            <aside className="w-64 bg-slate-900 text-white border-r border-gray-800 flex flex-col shadow-xl">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {role === 'admin' ? 'Master Admin' : 'Revenda Partner'}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Gestão Corporativa</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link key={item.href} to={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={`w-full justify-start gap-3 mb-1 ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-slate-800" onClick={logout}>
                        <LogOut className="h-5 w-5" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
                <header className="h-16 bg-white dark:bg-slate-900 border-b px-8 flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                        {navItems.find(i => i.href === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    {/* Maybe User Profile here later */}
                </header>
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
