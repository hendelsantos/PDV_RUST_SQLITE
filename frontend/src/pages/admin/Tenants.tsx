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
import { Pencil, Trash2 } from "lucide-react";
import { businessTypes, getBusinessTypeLabel, getBusinessTypeConfig } from "@/lib/businessTypes";
import CustomFieldsForm from "@/components/CustomFieldsForm";

interface Tenant {
    id: string;
    name: string;
    plan_id?: string;
    status: string;
    business_type?: string;
    created_at: string;
    custom_fields?: string; // JSON string
    updated_at?: string;
}

export default function Tenants() {
    const [tenants, setTenants] = useState<Tenant[]>([]);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const { data } = await api.get("/admin/tenants");
            setTenants(data);
        } catch (error) {
            console.error("Failed to fetch tenants", error);
        }
    };

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTenantName, setNewTenantName] = useState("");
    const [newTenantType, setNewTenantType] = useState("retail");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [ownerPassword, setOwnerPassword] = useState("");
    const [customFields, setCustomFields] = useState<Record<string, any>>({});

    const handleCustomFieldChange = (name: string, value: any) => {
        setCustomFields(prev => ({ ...prev, [name]: value }));
    };

    const handleBusinessTypeChange = (type: string) => {
        setNewTenantType(type);
        setCustomFields({}); // Reset custom fields when type changes
    };

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [editName, setEditName] = useState("");
    const [editType, setEditType] = useState("");
    const [editStatus, setEditStatus] = useState("");
    const [editCustomFields, setEditCustomFields] = useState<Record<string, any>>({});

    const handleEditCustomFieldChange = (name: string, value: any) => {
        setEditCustomFields(prev => ({ ...prev, [name]: value }));
    };

    const handleEditBusinessTypeChange = (type: string) => {
        setEditType(type);
        setEditCustomFields({}); // Reset when type changes
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
                owner_password: ownerPassword,
                custom_fields: JSON.stringify(customFields)
            });
            setIsCreateOpen(false);
            setNewTenantName("");
            setOwnerEmail("");
            setOwnerPassword("");
            setCustomFields({});
            fetchTenants();
            alert("Loja criada com sucesso!");
        } catch (error) {
            console.error("Failed to create tenant", error);
            alert("Erro ao criar loja.");
        }
    };

    const openEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setEditName(tenant.name);
        setEditType(tenant.business_type || "retail");
        setEditStatus(tenant.status);

        // Parse custom_fields if exists
        try {
            const fields = tenant.custom_fields ? JSON.parse(tenant.custom_fields) : {};
            setEditCustomFields(fields);
        } catch {
            setEditCustomFields({});
        }

        setIsEditOpen(true);
    };

    const handleUpdateTenant = async () => {
        if (!editingTenant) return;
        try {
            await api.put(`/admin/tenants/${editingTenant.id}`, {
                name: editName,
                business_type: editType,
                status: editStatus,
                custom_fields: JSON.stringify(editCustomFields)
            });
            setIsEditOpen(false);
            setEditingTenant(null);
            fetchTenants();
            alert("Loja atualizada!");
        } catch (error) {
            console.error("Failed to update tenant", error);
            alert("Erro ao atualizar loja.");
        }
    };

    const handleDeleteTenant = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta loja? Isso pode excluir todos os dados vinculados.")) return;
        try {
            await api.delete(`/admin/tenants/${id}`);
            fetchTenants();
            alert("Loja excluída.");
        } catch (error) {
            console.error("Failed to delete tenant", error);
            alert("Erro ao excluir loja.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Clientes (Tenants)</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Novo Cliente</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome da Empresa</Label>
                                <Input
                                    value={newTenantName}
                                    onChange={(e) => setNewTenantName(e.target.value)}
                                    placeholder="Ex: Minha Loja"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Negócio</Label>
                                <Select value={newTenantType} onValueChange={handleBusinessTypeChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <CustomFieldsForm
                                fields={getBusinessTypeConfig(newTenantType)?.customFields || []}
                                values={customFields}
                                onChange={handleCustomFieldChange}
                            />

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
                                Criar Cliente e Usuário
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Loja</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome da Empresa</Label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Negócio</Label>
                                <Select value={editType} onValueChange={handleEditBusinessTypeChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <CustomFieldsForm
                                fields={getBusinessTypeConfig(editType)?.customFields || []}
                                values={editCustomFields}
                                onChange={handleEditCustomFieldChange}
                            />

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                        <SelectItem value="suspended">Suspenso</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleUpdateTenant} className="w-full">
                                Salvar Alterações
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((tenant) => (
                            <TableRow key={tenant.id}>
                                <TableCell className="font-medium">{tenant.name}</TableCell>
                                <TableCell>
                                    {getBusinessTypeLabel(tenant.business_type || 'retail')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                                        {tenant.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(tenant)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTenant(tenant.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tenants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    Nenhum tenant encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
