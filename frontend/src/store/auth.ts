import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    tenantType: string | null;
    role: string | null;
    setToken: (token: string | null) => void;
    setTenantType: (type: string | null) => void;
    setRole: (role: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            tenantType: null,
            role: null,
            setToken: (token) => set({ token }),
            setTenantType: (type) => set({ tenantType: type }),
            setRole: (role) => set({ role }),
            logout: () => set({ token: null, tenantType: null, role: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
