import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Package } from "lucide-react";

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock_quantity: number;
    sku: string | null;
}

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Preço deve ser maior ou igual a 0"),
    stock_quantity: z.coerce.number().min(0, "Estoque deve ser maior ou igual a 0"),
    sku: z.string().optional(),
});

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            stock_quantity: 0,
            sku: "",
        },
    });

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/products");
            setProducts(data);
        } catch (error) {
            console.error("Falha ao buscar produtos", error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Backend expects integer cents
            await api.post("/products", values);
            setOpen(false);
            form.reset();
            fetchProducts();
        } catch (error) {
            console.error("Falha ao criar produto", error);
        }
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Produtos</h1>
                    <p className="text-gray-500">Gerencie seu inventário e preços.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Novo Produto
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Produto</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Camiseta Básica" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Descrição do produto" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control as any}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Preço (centavos)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="stock_quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estoque</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control as any}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU (Código)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SKU-123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">Salvar Produto</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                            <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                            <TableHead className="font-semibold text-gray-700">Preço</TableHead>
                            <TableHead className="font-semibold text-gray-700">Estoque</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    {product.name}
                                </TableCell>
                                <TableCell className="text-gray-500">{product.sku || "-"}</TableCell>
                                <TableCell className="font-bold text-gray-700">{formatCurrency(product.price)}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {product.stock_quantity} un
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-48 text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-10 w-10 text-gray-300" />
                                        <p>Nenhum produto encontrado. Adicione um para começar.</p>
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
