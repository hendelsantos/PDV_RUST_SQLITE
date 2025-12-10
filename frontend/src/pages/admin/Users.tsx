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

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get("/admin/users");
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("");
    const [editPassword, setEditPassword] = useState("");

    const handleCreateUser = async () => {
        if (!email || !password || !role) {
            alert("Preencha todos os campos");
            return;
        }

        try {
            await api.post("/admin/users", {
                email,
                password,
                role
            });
            setIsCreateOpen(false);
            setEmail("");
            setPassword("");
            fetchUsers();
            alert("Usuário criado com sucesso!");
        } catch (error) {
            console.error("Failed to create user", error);
            alert("Erro ao criar usuário.");
        }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setEditEmail(user.email);
        setEditRole(user.role);
        setEditPassword(""); // Reset password field
        setIsEditOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            await api.put(`/admin/users/${editingUser.id}`, {
                email: editEmail,
                role: editRole,
                password: editPassword ? editPassword : undefined
            });
            setIsEditOpen(false);
            setEditingUser(null);
            fetchUsers();
            alert("Usuário atualizado!");
        } catch (error) {
            console.error("Failed to update user", error);
            alert("Erro ao atualizar usuário.");
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
            alert("Usuário excluído.");
        } catch (error: any) {
            console.error("Failed to delete user", error);
            const msg = error.response?.data || "Erro ao excluir usuário.";
            alert(msg);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários do Sistema</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Novo Usuário</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@exemplo.com"
                                    type="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha</Label>
                                <Input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******"
                                    type="password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Função (Role)</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Lojista (User)</SelectItem>
                                        <SelectItem value="reseller">Revendedor</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCreateUser} className="w-full">
                                Criar Usuário
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    type="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nova Senha (Opcional)</Label>
                                <Input
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="Deixe em branco para manter"
                                    type="password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Função (Role)</Label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Lojista (User)</SelectItem>
                                        <SelectItem value="reseller">Revendedor</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleUpdateUser} className="w-full">
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
                            <TableHead>Email</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        user.role === 'admin' ? 'default' :
                                            user.role === 'reseller' ? 'secondary' : 'outline'
                                    }>
                                        {user.role.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
