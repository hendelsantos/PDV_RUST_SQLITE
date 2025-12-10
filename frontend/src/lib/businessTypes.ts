// Business Type Field Configurations
// Defines what custom fields each business type should have

export interface CustomField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'select';
    options?: string[]; // For select type
    required?: boolean;
    placeholder?: string;
}

export interface BusinessTypeConfig {
    value: string;
    label: string;
    emoji: string;
    customFields: CustomField[];
}

export const businessTypeConfigs: BusinessTypeConfig[] = [
    {
        value: 'retail',
        label: '🏪 Varejo Geral',
        emoji: '🏪',
        customFields: []
    },
    {
        value: 'pharmacy',
        label: '💊 Farmácia/Drogaria',
        emoji: '💊',
        customFields: [
            { name: 'requires_prescription', label: 'Controla Receitas', type: 'boolean' },
            { name: 'tracks_batch', label: 'Controla Lotes', type: 'boolean' },
            { name: 'tracks_expiry', label: 'Controla Validade', type: 'boolean' },
        ]
    },
    {
        value: 'beauty',
        label: '💇 Salão de Beleza/Estética',
        emoji: '💇',
        customFields: [
            { name: 'has_appointments', label: 'Sistema de Agendamento', type: 'boolean' },
            { name: 'num_professionals', label: 'Número de Profissionais', type: 'number', placeholder: 'Ex: 5' },
        ]
    },
    {
        value: 'gym',
        label: '💪 Academia/Fitness',
        emoji: '💪',
        customFields: [
            { name: 'has_membership', label: 'Controla Mensalidades', type: 'boolean' },
            { name: 'has_checkin', label: 'Sistema de Check-in', type: 'boolean' },
            { name: 'max_members', label: 'Capacidade Máxima', type: 'number', placeholder: 'Ex: 200' },
        ]
    },
    {
        value: 'food',
        label: '🍽️ Restaurante/Alimentação',
        emoji: '🍽️',
        customFields: [
            { name: 'has_tables', label: 'Controla Mesas', type: 'boolean' },
            { name: 'num_tables', label: 'Número de Mesas', type: 'number', placeholder: 'Ex: 20' },
            { name: 'has_delivery', label: 'Faz Delivery', type: 'boolean' },
        ]
    },
    {
        value: 'automotive',
        label: '🔧 Automotivo (Oficina/Autopeças)',
        emoji: '🔧',
        customFields: [
            { name: 'service_type', label: 'Tipo de Serviço', type: 'select', options: ['Oficina', 'Autopeças', 'Ambos'] },
        ]
    },
    {
        value: 'health',
        label: '🏥 Clínica/Consultório',
        emoji: '🏥',
        customFields: [
            { name: 'has_appointments', label: 'Sistema de Agendamento', type: 'boolean' },
            { name: 'num_doctors', label: 'Número de Profissionais', type: 'number', placeholder: 'Ex: 3' },
        ]
    },
    {
        value: 'education',
        label: '📚 Escola/Cursos',
        emoji: '📚',
        customFields: [
            { name: 'has_enrollment', label: 'Controla Matrículas', type: 'boolean' },
            { name: 'num_classes', label: 'Número de Turmas', type: 'number', placeholder: 'Ex: 10' },
        ]
    },
    {
        value: 'pet',
        label: '🐾 Pet Shop',
        emoji: '🐾',
        customFields: [
            { name: 'has_grooming', label: 'Oferece Banho e Tosa', type: 'boolean' },
            { name: 'has_vet', label: 'Tem Veterinário', type: 'boolean' },
        ]
    },
    {
        value: 'clothing',
        label: '👔 Vestuário/Moda',
        emoji: '👔',
        customFields: [
            { name: 'tracks_sizes', label: 'Controla Tamanhos (P/M/G)', type: 'boolean' },
        ]
    },
    {
        value: 'electronics',
        label: '📱 Eletrônicos',
        emoji: '📱',
        customFields: [
            { name: 'tracks_warranty', label: 'Controla Garantias', type: 'boolean' },
            { name: 'has_repair', label: 'Oferece Assistência Técnica', type: 'boolean' },
        ]
    },
    {
        value: 'bookstore',
        label: '📖 Livraria/Papelaria',
        emoji: '📖',
        customFields: [
            { name: 'tracks_isbn', label: 'Controla ISBN', type: 'boolean' },
        ]
    },
    {
        value: 'construction',
        label: '🏗️ Materiais de Construção',
        emoji: '🏗️',
        customFields: [
            { name: 'tracks_volume', label: 'Controla Volumes/Medidas', type: 'boolean' },
        ]
    },
    {
        value: 'wholesale',
        label: '📦 Atacado',
        emoji: '📦',
        customFields: [
            { name: 'min_order', label: 'Pedido Mínimo', type: 'number', placeholder: 'Ex: 100' },
        ]
    },
    {
        value: 'service',
        label: '🛠️ Serviços Gerais',
        emoji: '🛠️',
        customFields: [
            { name: 'has_work_orders', label: 'Usa Ordens de Serviço', type: 'boolean' },
        ]
    },
];

export const getBusinessTypeConfig = (type: string): BusinessTypeConfig | undefined => {
    return businessTypeConfigs.find(config => config.value === type);
};

// Legacy support
export const businessTypes = businessTypeConfigs.map(config => ({
    value: config.value,
    label: config.label,
    emoji: config.emoji
}));

export const getBusinessTypeLabel = (type: string): string => {
    const config = getBusinessTypeConfig(type);
    return config ? config.label : type;
};

export const getBusinessTypeEmoji = (type: string): string => {
    const config = getBusinessTypeConfig(type);
    return config ? config.emoji : '🏪';
};
