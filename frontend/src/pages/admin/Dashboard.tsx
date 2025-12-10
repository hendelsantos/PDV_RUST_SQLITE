import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Activity, Store, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: "Gerenciar Lojas",
            description: "Visualize e gerencie todos os tenants.",
            icon: Store,
            href: "/admin/tenants",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Equipe de Revenda",
            description: "Adicione e monitore seus revendedores.",
            icon: Users,
            href: "/admin/resellers",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        },
        {
            title: "Planos e Assinaturas",
            description: "Configure os preços e recursos dos planos.",
            icon: CreditCard,
            href: "/admin/plans",
            color: "text-green-500",
            bgColor: "bg-green-500/10"
        },
        {
            title: "Usuários do Sistema (Geral)",
            description: "Crie Admins, Suporte ou usuários avulsos.",
            icon: Users,
            href: "/admin/users",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10"
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
                    Central de Gestão
                </h1>
                <p className="text-lg text-muted-foreground">
                    Bem-vindo ao painel Master. O que você deseja gerenciar hoje?
                </p>
            </div>

            {/* Quick Access Menu */}
            <div className="grid gap-6 md:grid-cols-3">
                {menuItems.map((item, index) => (
                    <motion.div
                        key={item.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-0 shadow-md h-full"
                            onClick={() => navigate(item.href)}
                        >
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={`p-3 rounded-xl ${item.bgColor}`}>
                                    <item.icon className={`h-8 w-8 ${item.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>{item.title}</CardTitle>
                                    <CardDescription>{item.description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="pt-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Resumo Operacional</h3>
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
                            <Store className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">128</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revendedores</CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ 45.231,00</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
