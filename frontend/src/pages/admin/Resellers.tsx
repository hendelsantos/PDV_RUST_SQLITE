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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Reseller {
    id: string;
    email: string;
    created_at: string;
}

export default function Resellers() {
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        fetchResellers();
    }, []);

    const fetchResellers = async () => {
        try {
            const { data } = await api.get("/admin/resellers");
            setResellers(data);
        } catch (error) {
            console.error("Failed to fetch resellers", error);
        }
    };

    const handleCreateReseller = async () => {
        try {
            await api.post("/admin/resellers", {
                email,
                password,
            });
            setIsCreateOpen(false);
            setEmail("");
            setPassword("");
            fetchResellers();
        } catch (error) {
            console.error("Failed to create reseller", error);
            alert("Erro ao criar revendedor");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Revendedores</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Novo Revendedor</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Revendedor</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@revenda.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleCreateReseller} className="w-full">
                                Criar Revendedor
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {resellers.map((reseller) => (
                            <TableRow key={reseller.id}>
                                <TableCell className="font-medium">{reseller.email}</TableCell>
                                <TableCell>
                                    <Badge variant="default">Ativo</Badge>
                                </TableCell>
                                <TableCell>{new Date(reseller.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                        {resellers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-gray-500">
                                    Nenhum revendedor encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
