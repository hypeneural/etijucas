// ======================================================
// Vehicle API Service - eTijucas
// Integrates with wdapi2.com.br through backend proxy
// ======================================================

import { apiClient, ApiError } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

// ==================== Types ====================

export interface VehicleBasicData {
    brand: string | null;
    model: string | null;
    color: string | null;
    uf: string | null;
    municipio: string | null;
    situacao: string | null;
    logoUrl: string | null;
    ano: string | null;
    anoModelo: string | null;
    origem: string | null;
    chassi: string | null;
    marcaModelo: string | null;
}

export interface VehicleExtraData {
    ano_fabricacao?: string;
    ano_modelo?: string;
    combustivel?: string;
    especie?: string;
    tipo_veiculo?: string;
    nacionalidade?: string;
    municipio?: string;
    uf?: string;
    placa?: string;
    placa_modelo_antigo?: string;
    placa_modelo_novo?: string;
    quantidade_passageiro?: string;
    cilindradas?: string;
    cap_maxima_tracao?: string;
    peso_bruto_total?: string;
    eixos?: string;
    [key: string]: string | undefined;
}

export interface VehicleFipeEntry {
    ano_modelo: string;
    codigo_fipe: string;
    codigo_marca: number;
    codigo_modelo: string;
    combustivel: string;
    texto_marca: string;
    texto_modelo: string;
    texto_valor: string;
    score: number;
}

export interface VehicleFipeData {
    dados: VehicleFipeEntry[];
}

export interface VehicleCacheInfo {
    hit: boolean;
    fetchedAt: string | null;
    expiresAt: string | null;
    lastStatus: number | null;
    lastError: string | null;
}

export interface VehicleAvailableSections {
    basic: boolean;
    extra: boolean;
    fipe: boolean;
    logo: boolean;
}

export interface VehicleLookupResponse {
    ok: boolean;
    plate: string;
    plateType: 'old' | 'mercosul' | null;
    finalDigit: number | null;
    cache: VehicleCacheInfo;
    availableSections: VehicleAvailableSections;
    data: {
        basic?: VehicleBasicData;
        extra?: VehicleExtraData;
        fipe?: VehicleFipeData;
    };
    code?: string;
    message?: string;
}

export interface VehicleLookupRequest {
    plate: string;
    refresh?: boolean;
    sections?: ('basic' | 'extra' | 'fipe')[];
}

// ==================== Service ====================

export const vehicleService = {
    /**
     * Lookup vehicle by plate
     * Uses backend cache (30 days for success, 24h for not found)
     */
    async lookup(request: VehicleLookupRequest): Promise<VehicleLookupResponse> {
        try {
            const response = await apiClient.post<VehicleLookupResponse>(
                ENDPOINTS.vehicles.lookup,
                request
            );
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                // Return structured error response
                return {
                    ok: false,
                    plate: request.plate.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7),
                    plateType: null,
                    finalDigit: null,
                    cache: {
                        hit: false,
                        fetchedAt: null,
                        expiresAt: null,
                        lastStatus: error.status,
                        lastError: error.message,
                    },
                    availableSections: {
                        basic: false,
                        extra: false,
                        fipe: false,
                        logo: false,
                    },
                    data: {},
                    code: error.code ?? 'ERROR',
                    message: error.message,
                };
            }
            throw error;
        }
    },

    /**
     * Lookup vehicle and return only if successful
     * Throws on error
     */
    async lookupOrThrow(plate: string): Promise<VehicleLookupResponse> {
        const response = await this.lookup({ plate });

        if (!response.ok) {
            throw new ApiError(
                response.message ?? 'Veículo não encontrado',
                response.cache.lastStatus ?? 404,
                response.code
            );
        }

        return response;
    },

    /**
     * Force refresh vehicle data (bypass cache)
     */
    async refreshVehicle(plate: string): Promise<VehicleLookupResponse> {
        return this.lookup({ plate, refresh: true });
    },

    /**
     * Get FIPE value for a vehicle
     */
    async getFipeValue(plate: string): Promise<VehicleFipeEntry | null> {
        const response = await this.lookup({ plate, sections: ['fipe'] });

        if (!response.ok || !response.data.fipe?.dados?.length) {
            return null;
        }

        // Return entry with highest score
        const entries = response.data.fipe.dados;
        return entries.reduce((best, current) =>
            current.score > (best?.score ?? 0) ? current : best
            , entries[0]);
    },

    /**
     * Check if vehicle exists (quick check)
     */
    async exists(plate: string): Promise<boolean> {
        const response = await this.lookup({ plate, sections: ['basic'] });
        return response.ok && response.availableSections.basic;
    },
};

export default vehicleService;
