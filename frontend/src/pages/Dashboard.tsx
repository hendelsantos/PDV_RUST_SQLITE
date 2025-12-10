import SalesOverviewWidget from "@/components/widgets/SalesOverviewWidget";
import TopProductsWidget from "@/components/widgets/TopProductsWidget";
import InventoryAlertsWidget from "@/components/widgets/InventoryAlertsWidget";
import SalesTrendChart from "@/components/widgets/SalesTrendChart";

export default function Dashboard() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-800">Painel de Controle</h1>
                <p className="text-muted-foreground">Visão geral do desempenho em tempo real.</p>
            </div>

            {/* Métricas Principais */}
            <SalesOverviewWidget />

            {/* Gráficos e Widgets */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Gráfico de Tendência - Ocupa 2 colunas */}
                <div className="lg:col-span-2">
                    <SalesTrendChart />
                </div>

                {/* Alertas de Estoque */}
                <div className="lg:col-span-1">
                    <InventoryAlertsWidget />
                </div>
            </div>

            {/* Produtos Mais Vendidos */}
            <div className="grid gap-4 md:grid-cols-1">
                <TopProductsWidget />
            </div>
        </div>
    );
}
