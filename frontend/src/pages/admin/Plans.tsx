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
import { Plus } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    price: number;
    max_users: number;
}

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    price: z.coerce.number().min(0),
    max_users: z.coerce.number().min(1),
});

export default function Plans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            price: 0,
            max_users: 1,
        },
    });

    const fetchPlans = async () => {
        try {
            const { data } = await api.get("/admin/plans");
            setPlans(data);
        } catch (error) {
            console.error("Failed to fetch plans", error);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await api.post("/admin/plans", values);
            setOpen(false);
            form.reset();
            fetchPlans();
        } catch (error) {
            console.error("Failed to create plan", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Planos de Assinatura</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Plano
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Plano</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Plano</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Pro" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                    name="max_users"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Máximo de Usuários</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">Salvar</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Max Usuários</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell>R$ {(plan.price / 100).toFixed(2)}</TableCell>
                                <TableCell>{plan.max_users}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
