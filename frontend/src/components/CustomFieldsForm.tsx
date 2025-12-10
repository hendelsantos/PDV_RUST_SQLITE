import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomField } from "@/lib/businessTypes";

interface CustomFieldsFormProps {
    fields: CustomField[];
    values: Record<string, any>;
    onChange: (name: string, value: any) => void;
}

export default function CustomFieldsForm({ fields, values, onChange }: CustomFieldsFormProps) {
    if (fields.length === 0) return null;

    return (
        <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3">⚙️ Configurações Específicas</h4>
            <div className="space-y-4">
                {fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                        {field.type === 'boolean' ? (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.name}
                                    checked={values[field.name] || false}
                                    onCheckedChange={(checked: boolean) => onChange(field.name, checked)}
                                />
                                <Label htmlFor={field.name} className="cursor-pointer">
                                    {field.label}
                                </Label>
                            </div>
                        ) : field.type === 'number' ? (
                            <>
                                <Label>{field.label}</Label>
                                <Input
                                    type="number"
                                    value={values[field.name] || ''}
                                    onChange={(e) => onChange(field.name, parseInt(e.target.value) || 0)}
                                    placeholder={field.placeholder}
                                />
                            </>
                        ) : field.type === 'select' ? (
                            <>
                                <Label>{field.label}</Label>
                                <Select
                                    value={values[field.name] || ''}
                                    onValueChange={(value) => onChange(field.name, value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.options?.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </>
                        ) : (
                            <>
                                <Label>{field.label}</Label>
                                <Input
                                    type="text"
                                    value={values[field.name] || ''}
                                    onChange={(e) => onChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
