import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import api from "@/lib/api";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface Sale {
    id: string;
    total_amount: number;
    created_at: string;
}

interface DashboardStats {
    total_revenue: number;
    sales_count: number;
    recent_sales: Sale[];
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get("/sales/stats");
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    if (!stats) {
        return <div className="p-8 text-center text-gray-500">Carregando estatísticas...</div>;
    }

    // Prepare chart data (reverse to show oldest to newest)
    const chartData = [...stats.recent_sales].reverse().map(sale => ({
        date: new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amount: sale.total_amount / 100, // convert cents to float
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-800">Painel de Controle</h1>
                <p className="text-muted-foreground">Visão geral do desempenho em tempo real.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total_revenue / 100)}
                        </div>
                        <p className="text-xs text-muted-foreground">Acumulado total</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Vendas Realizadas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.sales_count}</div>
                        <p className="text-xs text-muted-foreground">Transações concluídas</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.sales_count > 0
                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((stats.total_revenue / stats.sales_count) / 100)
                                : "R$ 0,00"}
                        </div>
                        <p className="text-xs text-muted-foreground">Média por venda</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Produtos</CardTitle>
                        <Package className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Gestão de Inventário</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Tendência de Vendas (Últimas 5)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `R$${value}`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                            labelStyle={{ color: '#333' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: "#2563eb" }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    Sem dados suficientes para o gráfico.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
