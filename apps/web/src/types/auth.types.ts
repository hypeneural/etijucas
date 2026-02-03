// Auth Types for Login & Register

// Address from ViaCEP
export interface Address {
    cep: string;
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    localidade: string;
    uf: string;
}

// ViaCEP API Response
export interface ViaCEPResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    unidade: string;
    bairro: string;
    localidade: string;
    uf: string;
    estado: string;
    regiao: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
}

// User model
export interface User {
    id: string;
    phone: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    address?: Address;
    verified: boolean;
    createdAt: Date;
}

// Auth state
export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// OTP state
export interface OTPState {
    phone: string;
    expiresAt: Date;
    verified: boolean;
}

// Register DTO
export interface RegisterDTO {
    phone: string;
    password: string;
    name: string;
    email?: string;
    address?: Address;
}

// Login DTO
export interface LoginDTO {
    phone: string;
    password: string;
}

// Register wizard step
export type RegisterStep = 'phone' | 'verify' | 'profile' | 'address' | 'done';
