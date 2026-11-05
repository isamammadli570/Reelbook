import {create, isAxiosError, type AxiosRequestConfig} from "axios";
import {ENV} from "@/lib/env";
import {TMDB_BASE_API} from "@/constants/endpoints";
import {ERRORS} from "@/constants/errors";
import {TMDB_LANGUAGE} from "@/constants/other";
import i18n from "@/i18n";

const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
    status: number | null;
    code: string | null;
    details: unknown;
    isNetworkError: boolean;
    url: string | null;

    constructor(params: {
        message: string;
        status?: number | null;
        code?: string | null;
        details?: unknown;
        isNetworkError?: boolean;
        url?: string | null;
    }) {
        super(params.message);
        this.name = "ApiError";
        this.status = params.status ?? null;
        this.code = params.code ?? null;
        this.details = params.details;
        this.isNetworkError = params.isNetworkError ?? false;
        this.url = params.url ?? null;
    }
}

const apiClient = create({baseURL: TMDB_BASE_API, timeout: DEFAULT_TIMEOUT_MS});

const resolveTmdbLanguage = (): string => {
    const language = (i18n.resolvedLanguage ?? i18n.language ?? "az").split("-")[0].toLowerCase();
    return TMDB_LANGUAGE[language] ?? TMDB_LANGUAGE.en;
};

const httpStatusMessage = (status: number | null): string => {
    if (status === 401) return i18n.t(ERRORS.UNAUTHORIZED);
    if (status === 404) return i18n.t(ERRORS.NOT_FOUND);
    if (status !== null && status >= 500) return i18n.t(ERRORS.SERVER);
    return i18n.t(ERRORS.GENERIC);
};

/** TMDB's own messages are English and technical, so the user sees a translated message per status. */
export const normalizeApiError = (error: unknown): ApiError => {
    if (error instanceof ApiError) return error;

    if (isAxiosError(error)) {
        const status = error.response?.status ?? null;
        const isNetworkError = !error.response;
        return new ApiError({
            message: isNetworkError ? i18n.t(ERRORS.NETWORK) : httpStatusMessage(status),
            status,
            code: error.code ?? null,
            details: error.response?.data,
            isNetworkError,
            url: [error.config?.baseURL, error.config?.url].filter(Boolean).join("") || null,
        });
    }

    return new ApiError({message: error instanceof Error ? error.message : i18n.t(ERRORS.GENERIC)});
};

apiClient.interceptors.request.use((config) => {
    config.headers.set("Authorization", `Bearer ${ENV.tmdbToken}`);
    config.params = {language: resolveTmdbLanguage(), ...config.params};
    return config;
});

type RequestConfig = AxiosRequestConfig;

const execute = async <TResponse>(run: () => Promise<{data: TResponse}>): Promise<TResponse> => {
    try {
        return (await run()).data;
    } catch (error) {
        throw normalizeApiError(error);
    }
};

/** TMDB is read-only for this app, so only GET is exposed. */
export const api = {
    get: <TResponse>(url: string, config?: RequestConfig) => execute(() => apiClient.get<TResponse>(url, config)),
};

export const segment = (value: string | number): string => encodeURIComponent(String(value));
