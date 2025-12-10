import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, DollarSign } from "lucide-react";

interface Sale {
    id: string;
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function Sales() {
    const [sales, setSales] = useState<Sale[]>([]);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const { data } = await api.get("/sales");
            setSales(data);
        } catch (error) {
            console.error("Falha ao buscar vendas", error);
        }
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const translatePayment = (method: string) => {
        const map: Record<string, string> = {
            'cash': 'Dinheiro',
            'credit_card': 'Crédito',
            'debit_card': 'Débito',
            'pix': 'Pix'
        };
        return map[method] || method;
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Histórico de Vendas</h1>
                <p className="text-gray-500">Acompanhe todas as transações realizadas.</p>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-semibold text-gray-700">Data e Hora</TableHead>
                            <TableHead className="font-semibold text-gray-700">ID da Venda</TableHead>
                            <TableHead className="font-semibold text-gray-700">Pagamento</TableHead>
                            <TableHead className="font-semibold text-gray-700">Status</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.map((sale) => (
                            <TableRow key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {formatDate(sale.created_at)}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-gray-500 bg-gray-100 p-1 px-2 rounded w-fit">
                                    {sale.id.slice(0, 8)}...
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-400" />
                                        {translatePayment(sale.payment_method)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={sale.status === 'completed' ? 'default' : 'destructive'} className="uppercase text-[10px] tracking-wide">
                                        {sale.status === 'completed' ? 'Concluído' : 'Cancelado'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-900">
                                    {formatCurrency(sale.total_amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {sales.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-48 text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <DollarSign className="h-10 w-10 text-gray-300" />
                                        <p>Nenhuma venda registrada até o momento.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
