import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Users, Plus, Search, User } from "lucide-react";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
}

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            notes: "",
        },
    });

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get("/customers");
            setCustomers(data);
            setFilteredCustomers(data);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        const lower = search.toLowerCase();
        setFilteredCustomers(
            customers.filter(c =>
                c.name.toLowerCase().includes(lower) ||
                (c.email && c.email.toLowerCase().includes(lower)) ||
                (c.phone && c.phone.includes(lower))
            )
        );
    }, [search, customers]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Handle empty strings as null for optional fields if needed, or backend handles it.
            const payload = {
                ...values,
                email: values.email || null,
                phone: values.phone || null,
                notes: values.notes || null,
            };
            await api.post("/customers", payload);
            setOpen(false);
            form.reset();
            fetchCustomers();
        } catch (error) {
            console.error("Failed to create customer", error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-800">Clientes</h1>
                    <p className="text-muted-foreground">Gerencie sua base de clientes.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-sm">
                            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cadastrar Cliente</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Maria Silva" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="maria@exemplo.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone / WhatsApp (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(11) 99999-9999" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Anotações</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Cliente VIP, prefere contato por zap" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">Salvar Cliente</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2 bg-white p-2 rounded-md border shadow-sm max-w-sm">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0"
                />
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Anotações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow key={customer.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <User className="h-4 w-4" />
                                    </div>
                                    {customer.name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        {customer.email && <span className="text-gray-600">{customer.email}</span>}
                                        {customer.phone && <span className="text-gray-500">{customer.phone}</span>}
                                        {!customer.email && !customer.phone && <span className="text-gray-400 italic">Sem contato</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-500 max-w-xs truncate" title={customer.notes || ""}>
                                    {customer.notes || "-"}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-48 text-gray-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Users className="h-8 w-8 text-gray-300" />
                                        <p>Nenhum cliente encontrado.</p>
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
