import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Package, Users } from "lucide-react";
import MetricCard from "../MetricCard";
import api from "@/lib/api";

interface MetricsOverview {
    total_revenue: number;
    sales_count: number;
    average_ticket: number;
    products_count: number;
    customers_count: number;
}

export default function SalesOverviewWidget() {
    const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const { data } = await api.get("/metrics/overview");
                setMetrics(data);
            } catch (error) {
                console.error("Failed to fetch metrics overview", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (!metrics) return null;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard
                title="Receita Total"
                value={formatCurrency(metrics.total_revenue)}
                icon={DollarSign}
                description="Acumulado total"
                className="shadow-sm hover:shadow-md transition-shadow"
            />
            <MetricCard
                title="Vendas Realizadas"
                value={metrics.sales_count}
                icon={ShoppingCart}
                description="Transações concluídas"
                className="shadow-sm hover:shadow-md transition-shadow"
            />
            <MetricCard
                title="Ticket Médio"
                value={formatCurrency(metrics.average_ticket)}
                icon={TrendingUp}
                description="Média por venda"
                className="shadow-sm hover:shadow-md transition-shadow"
            />
            <MetricCard
                title="Produtos"
                value={metrics.products_count}
                icon={Package}
                description="Cadastrados"
                className="shadow-sm hover:shadow-md transition-shadow"
            />
            <MetricCard
                title="Clientes"
                value={metrics.customers_count}
                icon={Users}
                description="Cadastrados"
                className="shadow-sm hover:shadow-md transition-shadow"
            />
        </div>
    );
}
