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
    // Pequeño debounce: esperar un momento antes de recargar para
    // evitar que una petición concurrente (p.ej. durante el login)
    // interrumpa el flujo y fuerce una recarga innecesaria.
    setTimeout(() => {
      // Si durante el debounce se guardó un token (login exitoso), no recargar.
      if (!sessionStorage.getItem('sessionToken')) {
        window.location.reload();
      }
    }, 300);
    throw new Error('Sesión expirada');
  }

  return response;
}
