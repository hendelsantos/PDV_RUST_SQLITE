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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


interface Tenant {
    id: string;
    name: string;
    business_type?: string;
    status: string;
    created_at: string;
}

export default function ResellerDashboard() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTenantName, setNewTenantName] = useState("");
    const [newTenantType, setNewTenantType] = useState("retail");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [ownerPassword, setOwnerPassword] = useState("");
    // Reseller ID is automatically handled by backend via token claims

    useEffect(() => {
        fetchMyTenants();
    }, []);

    const fetchMyTenants = async () => {
        try {
            const { data } = await api.get("/admin/tenants"); // Backend filters for us based on role
            setTenants(data);
        } catch (error) {
            console.error("Failed to fetch my tenants", error);
        }
    };

    const handleCreateTenant = async () => {
        if (!newTenantName || !ownerEmail || !ownerPassword) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            await api.post("/admin/tenants", {
                name: newTenantName,
                business_type: newTenantType,
                owner_email: ownerEmail,
                owner_password: ownerPassword
            });
            setIsCreateOpen(false);
            setNewTenantName("");
            setOwnerEmail("");
            setOwnerPassword("");
            fetchMyTenants();
        } catch (error) {
            console.error("Failed to create tenant", error);
            alert("Erro ao criar loja. Verifique se o email já existe.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Minhas Lojas (Revenda)</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Nova Loja</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Nova Loja</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome da Loja</Label>
                                <Input
                                    value={newTenantName}
                                    onChange={(e) => setNewTenantName(e.target.value)}
                                    placeholder="Ex: Barbearia do João"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Negócio</Label>
                                <Select value={newTenantType} onValueChange={setNewTenantType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="retail">Varejo (Padrão)</SelectItem>
                                        <SelectItem value="service">Serviços</SelectItem>
                                        <SelectItem value="food">Alimentação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-semibold mb-3">Dados do Lojista (Dono)</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Email do Lojista</Label>
                                        <Input
                                            value={ownerEmail}
                                            onChange={(e) => setOwnerEmail(e.target.value)}
                                            placeholder="lojista@exemplo.com"
                                            type="email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Senha Inicial</Label>
                                        <Input
                                            value={ownerPassword}
                                            onChange={(e) => setOwnerPassword(e.target.value)}
                                            placeholder="******"
                                            type="password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleCreateTenant} className="w-full mt-4">
                                Criar Loja e Usuário
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="text-2xl font-bold">{tenants.length}</div>
                    <p className="text-xs text-muted-foreground">Lojas Ativas</p>
                </div>
                {/* Future: Commission Stats */}
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome da Loja</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((tenant) => (
                            <TableRow key={tenant.id}>
                                <TableCell className="font-medium">{tenant.name}</TableCell>
                                <TableCell>
                                    {tenant.business_type === 'service' ? 'Serviços' :
                                        tenant.business_type === 'food' ? 'Alimentação' : 'Varejo'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                                        {tenant.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                        {tenants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                                    Nenhuma loja encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
