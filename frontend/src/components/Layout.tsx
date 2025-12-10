import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    History,
    LogOut,
    Menu,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/", label: "Painel", icon: LayoutDashboard },
    { href: "/pos", label: "PDV (Vendas)", icon: ShoppingCart },
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/customers", label: "Clientes", icon: Users },
    { href: "/sales", label: "Histórico", icon: History },
];

export default function Layout() {
    const { pathname } = useLocation();
    const logout = useAuthStore((state) => state.logout);
    const tenantType = useAuthStore((state) => state.tenantType);

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col bg-white dark:bg-gray-800 border-r md:flex">
                <div className="p-6 border-b flex items-center justify-center">
                    <h1 className="text-2xl font-bold text-primary">SaaS PDV</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {/* Operational Menu Items Only */}
                    {navItems.filter(item => {
                        // If Reseller or Admin logs into the App layout, they can see operational stuff if they want, 
                        // but usually they use Backoffice. 
                        // For now let's just keep the Niche filter.

                        if (tenantType === 'service') {
                            // Service niche hides POS and Products
                            return !['/products', '/pos'].includes(item.href);
                        }
                        return true;
                    }).map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={logout}>
                        <LogOut className="h-5 w-5" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Mobile Header (TODO: implement sheet sidebar for mobile) */}
                <header className="h-16 flex items-center px-6 bg-white dark:bg-gray-800 border-b md:hidden">
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="ml-4 font-bold">SaaS PDV</span>
                </header>

                <div className="flex-1 p-8 overflow-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
