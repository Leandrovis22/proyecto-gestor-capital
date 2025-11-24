/**
 * Helper para obtener el token de sesión del sessionStorage
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('sessionToken');
}

/**
 * Helper para agregar headers de autenticación a un fetch
 */
export function getAuthHeaders(): HeadersInit {
  const token = getSessionToken();
  return token ? { 'X-Session-Token': token } : {};
}

/**
 * Wrapper para fetch que maneja automáticamente errores 401
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };

  const response = await fetch(url, { ...options, headers });

  // Si el token es inválido, cerrar sesión y recargar
  if (response.status === 401) {
    sessionStorage.removeItem('sessionToken');
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  return response;
}
