// Auth Types for Login & Register

// Address from ViaCEP (with optional bairroId for normalized matching)
export interface Address {
    cep: string;
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;        // Text from ViaCEP (auxiliary)
    bairroId?: string;     // UUID FK to bairros table (canonical)
    localidade: string;
    uf: string;
}

// ViaCEP API Response (legacy - direct ViaCEP calls)
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

// CEP Lookup Response from /api/v1/cep/{cep}
export interface CepLookupResponse {
    success: boolean;
    data?: {
        address: CepAddress;
        match: MatchResult;
        ui_hints: UIHints;
        available_bairros: BairroOption[];
    };
    error?: string;
    message?: string;
}

// Address data from CEP lookup
export interface CepAddress {
    cep: string;
    logradouro: string | null;
    complemento: string | null;
    bairro_text: string | null;
    city_name: string | null;
    uf: string | null;
    ibge_code: string | null;
    ddd: string | null;
}

// Match result from address matching
export interface MatchResult {
    tenant_city_id: string;
    cep_city_id: string | null;
    city_ok: boolean;
    bairro_id: string | null;
    bairro_ok: boolean;
    method: 'direct' | 'alias' | 'none' | 'city_mismatch';
    confidence: number;
}

// UI hints for frontend behavior
export interface UIHints {
    should_lock_bairro: boolean;
    focus_next: 'numero' | 'bairro';
    toast: string | null;
}

// Bairro option for selector
export interface BairroOption {
    id: string;
    nome: string;
    slug: string;
}

// User model
export interface User {
    id: string;
    phone: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    address?: Address;
    bairroId?: string;     // Direct bairro reference
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
    bairroId?: string;     // Canonical bairro reference
    address?: Address;
}

// Login DTO
export interface LoginDTO {
    phone: string;
    password: string;
}

// Register wizard step
export type RegisterStep = 'phone' | 'verify' | 'profile' | 'address' | 'done';

