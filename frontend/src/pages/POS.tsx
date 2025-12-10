import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingCart, Search, User, Check, ChevronsUpDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Product {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface Customer {
    id: string;
    name: string;
}

export default function POS() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");

    // Customer Selection State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);

    // Success & Receipt State
    const [lastSale, setLastSale] = useState<{
        items: CartItem[];
        total: number;
        paymentMethod: string;
        customerName: string | null;
        date: string;
    } | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/products");
            setProducts(data);
        } catch (error) {
            console.error("Falha ao buscar produtos", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get("/customers");
            setCustomers(data);
        } catch (error) {
            console.error("Falha ao buscar clientes", error);
        }
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            const payload = {
                payment_method: paymentMethod,
                customer_id: selectedCustomerId || null,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity
                }))
            };

            await api.post("/sales", payload);

            // Prepare Receipt Data
            setLastSale({
                items: [...cart],
                total: total,
                paymentMethod: paymentMethod,
                customerName: selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name || null : null,
                date: new Date().toLocaleString('pt-BR')
            });
            setShowSuccessDialog(true);

            setCart([]);
            setPaymentMethod("cash");
            setSelectedCustomerId(null);
            fetchProducts(); // Atualiza estoque
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Falha na venda. Verifique o estoque ou tente novamente.");
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById("receipt-content");
        if (printContent) {
            const windowUrl = 'about:blank';
            const uniqueName = new Date();
            const windowName = 'Print' + uniqueName.getTime();
            const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <style>
                                body { font-family: monospace; font-size: 12px; width: 300px; margin: 0; padding: 10px; }
                                .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                                .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                                .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; display: flex; justify-content: space-between; }
                                .footer { margin-top: 20px; text-align: center; font-size: 10px; }
                            </style>
                        </head>
                        <body>
                            ${printContent.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
            {/* Product List */}
            <div className="col-span-1 md:col-span-7 lg:col-span-8 flex flex-col h-full space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produtos..."
                        className="pl-9 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto p-1 text-sm">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            className="cursor-pointer hover:border-primary transition-all hover:shadow-md active:scale-95 duration-200"
                            onClick={() => addToCart(product)}
                        >
                            <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                                <div>
                                    <h3 className="font-semibold truncate text-gray-800" title={product.name}>{product.name}</h3>
                                    <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"} className="mt-1 text-xs">
                                        {product.stock_quantity > 0 ? `${product.stock_quantity} un` : 'Sem estoque'}
                                    </Badge>
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className="font-bold text-lg text-primary">
                                        {formatCurrency(product.price)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center h-48 text-gray-400">
                            <Search className="h-10 w-10 mb-2 opacity-50" />
                            <p>Nenhum produto encontrado.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart */}
            <Card className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col h-full shadow-md border-0 bg-white md:sticky md:top-4">
                <CardContent className="flex flex-col h-full p-0">
                    <div className="p-4 border-b bg-gray-50/50">
                        <div className="flex items-center gap-2 text-primary">
                            <ShoppingCart className="h-5 w-5" />
                            <h2 className="font-bold text-xl uppercase tracking-wider">Carrinho</h2>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-50/50 border-b">
                        <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCustomerCombobox}
                                    className="w-full justify-between bg-white"
                                >
                                    <div className="flex items-center">
                                        <User className="mr-2 h-4 w-4 opacity-50" />
                                        {selectedCustomerId
                                            ? customers.find((customer) => customer.id === selectedCustomerId)?.name
                                            : "Selecionar Cliente (Opcional)"}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum cliente.</CommandEmpty>
                                        <CommandGroup>
                                            {customers.map((customer) => (
                                                <CommandItem
                                                    key={customer.id}
                                                    value={customer.name}
                                                    onSelect={() => {
                                                        setSelectedCustomerId(customer.id === selectedCustomerId ? null : customer.id)
                                                        setOpenCustomerCombobox(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {customer.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
                                <p>Carrinho vazio</p>
                                <p className="text-sm">Selecione produtos para vender</p>
                            </div>
                        )}
                        {cart.map(item => (
                            <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-medium truncate" title={item.product.name}>{item.product.name}</p>
                                    <div className="text-sm text-gray-500 font-mono flex items-center gap-1">
                                        {formatCurrency(item.product.price)}
                                        <span className="text-xs text-gray-400">x</span>
                                        <span className="font-bold text-gray-700">{item.quantity}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeFromCart(item.product.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t bg-gray-50/50 space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-medium text-gray-500 uppercase">Total a Pagar</span>
                            <span className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</span>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Forma de Pagamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Dinheiro</SelectItem>
                                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                    <SelectItem value="pix">Pix</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                size="lg"
                                className="w-full h-12 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                                disabled={cart.length === 0}
                                onClick={handleCheckout}
                            >
                                Finalizar Venda
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-green-600 flex flex-col items-center gap-2">
                            <Check className="h-12 w-12 rounded-full bg-green-100 p-2" />
                            Venda Concluída!
                        </DialogTitle>
                    </DialogHeader>

                    <div id="receipt-content" className="bg-gray-50 p-4 rounded-md border text-sm font-mono my-4">
                        <div className="header text-center mb-4 pb-2 border-b border-dashed border-gray-300">
                            <h3 className="font-bold text-lg">MINHA LOJA</h3>
                            <p className="text-xs text-gray-500">{lastSale?.date}</p>
                            {lastSale?.customerName && <p className="text-xs mt-1">Cliente: {lastSale.customerName}</p>}
                        </div>
                        <div className="space-y-2">
                            {lastSale?.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{item.quantity}x {item.product.name}</span>
                                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="total mt-4 pt-2 border-t border-dashed border-gray-300 flex justify-between font-bold text-lg">
                            <span>TOTAL</span>
                            <span>{lastSale && formatCurrency(lastSale.total)}</span>
                        </div>
                        <div className="text-center text-xs text-gray-400 mt-4">
                            Pagamento: {lastSale?.paymentMethod === 'credit_card' ? 'Crédito' :
                                lastSale?.paymentMethod === 'debit_card' ? 'Débito' :
                                    lastSale?.paymentMethod === 'pix' ? 'Pix' : 'Dinheiro'}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowSuccessDialog(false)}>
                            Fechar
                        </Button>
                        <Button className="flex-1" onClick={handlePrint}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
