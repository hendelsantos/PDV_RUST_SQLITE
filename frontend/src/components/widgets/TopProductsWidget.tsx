import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import api from "@/lib/api";

interface TopProduct {
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
}

export default function TopProductsWidget() {
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const { data } = await api.get("/metrics/top-products");
                setProducts(data);
            } catch (error) {
                console.error("Failed to fetch top products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTopProducts();
    }, []);

    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxRevenue = Math.max(...products.map(p => p.revenue), 1);

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Produtos Mais Vendidos
                </CardTitle>
            </CardHeader>
            <CardContent>
                {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma venda registrada ainda
                    </p>
                ) : (
                    <div className="space-y-4">
                        {products.map((product, index) => (
                            <div key={product.product_id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-sm">{product.product_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {product.quantity_sold} unidades vendidas
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-sm">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(product.revenue / 100)}
                                    </p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
