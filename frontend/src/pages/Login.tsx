import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useState } from "react";

const formSchema = z.object({
    email: z.string().min(1, "Usuário ou Email é obrigatório"),
    password: z.string().min(1, "A senha é obrigatória"),
});

export default function Login() {
    const navigate = useNavigate();
    const setToken = useAuthStore((state) => state.setToken);
    const setTenantType = useAuthStore((state) => state.setTenantType);
    const setRole = useAuthStore((state) => state.setRole);
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const response = await api.post("/auth/login", values);
            setToken(response.data.token);
            setRole(response.data.role);
            setTenantType(response.data.business_type);

            // Redirect based on role
            if (response.data.role === 'reseller') {
                navigate("/reseller/dashboard");
            } else if (response.data.role === 'admin') {
                navigate("/admin"); // Redirect to Management Hub
            } else {
                navigate("/");
            }
        } catch (err) {
            setError("Credenciais inválidas. Tente novamente.");
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-[400px] shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Acessar Sistema</CardTitle>
                    <CardDescription className="text-center">
                        Entre com seu email e senha para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Usuário</FormLabel>
                                        <FormControl>
                                            <Input placeholder="seu@email.com ou usuário" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
                            <Button type="submit" className="w-full">Entrar</Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-muted-foreground">
                        Não tem uma conta? <Link to="/register" className="text-primary hover:underline">Cadastre-se</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
