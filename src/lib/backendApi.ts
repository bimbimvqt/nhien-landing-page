import type { Product, Promotion, StoreSettings } from '@/types';

const DEFAULT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

function isLocalhostUrl(baseUrl: string) {
  try {
    return LOCALHOST_NAMES.has(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}

function isBrowserOnLocalhost() {
  if (typeof window === 'undefined') {
    return false;
  }

  return LOCALHOST_NAMES.has(window.location.hostname);
}

function isSameBrowserHostname(baseUrl: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return new URL(baseUrl).hostname === window.location.hostname;
  } catch {
    return false;
  }
}

function getServerApiBaseUrl() {
  if (process.env.NODE_ENV !== 'production') {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PUBLIC_API_BASE_URL);
  }
  return normalizeBaseUrl(process.env.API_INTERNAL_URL || 'http://api:8080');
}

function getBrowserApiBaseUrl() {
  const configuredBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PUBLIC_API_BASE_URL,
  );

  if (
    process.env.NODE_ENV === 'production' &&
    ((isLocalhostUrl(configuredBaseUrl) && !isBrowserOnLocalhost()) ||
      isSameBrowserHostname(configuredBaseUrl))
  ) {
    return '';
  }

  return configuredBaseUrl;
}

async function requestJSON<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.error === 'string'
        ? errorBody.error
        : `Backend request failed with ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchStoreSettings() {
  return requestJSON<StoreSettings>(getServerApiBaseUrl(), '/api/store-settings', {
    cache: 'no-store',
  });
}

export function fetchProducts(options: { bestSeller?: boolean; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (options.bestSeller) params.set('best_seller', 'true');
  if (options.limit) params.set('limit', String(options.limit));
  const query = params.toString();

  return requestJSON<Product[]>(
    getBrowserApiBaseUrl(),
    `/api/products${query ? `?${query}` : ''}`,
  );
}

export function fetchActivePromotions(limit = 3) {
  const params = new URLSearchParams({
    active: 'true',
    limit: String(limit),
  });

  return requestJSON<Promotion[]>(getBrowserApiBaseUrl(), `/api/promotions?${params}`);
}
