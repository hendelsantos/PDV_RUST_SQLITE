import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package } from "lucide-react";
import api from "@/lib/api";

interface InventoryAlert {
    product_id: string;
    product_name: string;
    current_stock: number;
    min_stock: number;
}

export default function InventoryAlertsWidget() {
    const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const { data } = await api.get("/metrics/inventory-alerts");
                setAlerts(data);
            } catch (error) {
                console.error("Failed to fetch inventory alerts", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);

    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Alertas de Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getUrgencyColor = (stock: number) => {
        if (stock === 0) return "text-red-600 bg-red-50";
        if (stock <= 5) return "text-orange-600 bg-orange-50";
        return "text-yellow-600 bg-yellow-50";
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Alertas de Estoque
                </CardTitle>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="text-center py-8">
                        <Package className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-600">
                            Estoque em ordem!
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Todos os produtos com estoque adequado
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.product_id}
                                className={`p-3 rounded-lg border ${getUrgencyColor(alert.current_stock)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{alert.product_name}</p>
                                        <p className="text-xs mt-1">
                                            {alert.current_stock === 0 ? (
                                                <span className="font-semibold">Estoque esgotado!</span>
                                            ) : (
                                                <>
                                                    Apenas <span className="font-semibold">{alert.current_stock}</span> unidades restantes
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                                        <span className="text-lg font-bold">
                                            {alert.current_stock}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
