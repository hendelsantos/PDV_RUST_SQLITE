import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";

interface SalesTrendPoint {
    date: string;
    revenue: number;
    sales_count: number;
}

export default function SalesTrendChart() {
    const [trendData, setTrendData] = useState<SalesTrendPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrend = async () => {
            try {
                const { data } = await api.get("/metrics/sales-trend");
                setTrendData(data);
            } catch (error) {
                console.error("Failed to fetch sales trend", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrend();
    }, []);

    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Tendência de Vendas (Últimos 7 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] bg-gray-100 animate-pulse rounded" />
                </CardContent>
            </Card>
        );
    }

    const chartData = trendData.map(point => ({
        date: new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue: point.revenue / 100, // Convert cents to reais
        sales: point.sales_count,
    }));

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Tendência de Vendas (Últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Sem dados suficientes para o gráfico
                    </div>
                ) : (
                    <div className="h-[300px] w-full">
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
                                    formatter={(value: number, name: string) => {
                                        if (name === 'revenue') {
                                            return [
                                                new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL'
                                                }).format(value),
                                                'Receita'
                                            ];
                                        }
                                        return [value, 'Vendas'];
                                    }}
                                    labelStyle={{ color: '#333' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#2563eb" }}
                                    activeDot={{ r: 6 }}
                                    name="revenue"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#16a34a"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#16a34a" }}
                                    activeDot={{ r: 6 }}
                                    name="sales"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
