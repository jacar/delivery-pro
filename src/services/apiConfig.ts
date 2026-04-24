/**
 * Detección dinámica y robusta de la URL de la API.
 * Configurado para dominio principal: deliveryexpressmg.com
 */

const getApiBaseUrl = () => {
    const origin = window.location.origin;

    // 1. Detección Localhost → apunta al servidor de producción
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'https://deliveryexpressmg.com/api';
    }

    // 2. Producción: La app está en la raíz del dominio
    // API se accede directamente en /api
    return `${origin}/api`;
};


export const API_BASE_URL = getApiBaseUrl();
console.log('API_BASE_URL detectada:', API_BASE_URL);

/**
 * Formatea una URL de imagen para asegurar que sea absoluta.
 */
export const formatImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    
    // El dominio base para el storage es el mismo que la API sin el sufijo /api
    const domain = 'https://deliveryexpressmg.com';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${domain}${cleanUrl}`;
};
