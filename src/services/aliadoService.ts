import { Producto, Aliado } from '../types';
import { API_BASE_URL } from './apiConfig';

const listeners: (() => void)[] = [];

export const triggerRefreshAliados = () => {
  localStorage.removeItem('aliados_cache'); // Limpiar caché al haber cambios
  listeners.forEach(l => l());
};

export const listenAliados = (callback: (aliados: Aliado[]) => void) => {
  const fetchAliados = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/allies?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        // Mapear el campo imagenes y productos que vienen como string JSON
        const mapped = data.map((a: any) => ({
          ...a,
          aprobado: Boolean(Number(a.aprobado)), // Asegurar que sea boolean
          imagenes: typeof a.imagenes === 'string' ? JSON.parse(a.imagenes || '[]') : (a.imagenes || []),
          productos: typeof a.productos === 'string' ? JSON.parse(a.productos || '[]') : (a.productos || [])
        }));
        callback(mapped);
      }
    } catch (e) {
      console.error("Error fetching allies:", e);
    }
  };

  fetchAliados();
  const interval = setInterval(fetchAliados, 15000); // Poll cada 15 seg
  
  // Registrar listener para refresco inmediato
  listeners.push(fetchAliados);

  return () => {
    clearInterval(interval);
    const idx = listeners.indexOf(fetchAliados);
    if (idx > -1) listeners.splice(idx, 1);
  };
};

export const crearAliado = async (data: Partial<Aliado> & { id: string, ownerEmail: string }): Promise<void> => {
  const transformedData: any = { ...data };
  if (data.imagenes) transformedData.imagenes = JSON.stringify(data.imagenes);
  if (data.productos) transformedData.productos = JSON.stringify(data.productos);

  const response = await fetch(`${API_BASE_URL}/allies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transformedData)
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al crear el aliado en el servidor');
  }
  
  triggerRefreshAliados();
};

export const actualizarAliado = async (id: string, data: Partial<Aliado>) => {
  const transformedData: any = { ...data };
  if (data.imagenes) {
    transformedData.imagenes = JSON.stringify(data.imagenes);
  }
  if (data.productos) {
    transformedData.productos = JSON.stringify(data.productos);
  }

  const response = await fetch(`${API_BASE_URL}/allies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transformedData)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al actualizar el aliado');
  }

  triggerRefreshAliados();
};

export const eliminarAliado = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/allies/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al eliminar el aliado');
  }

  triggerRefreshAliados();
};

export const subirImagen = async (path: string, file: File | Blob): Promise<string> => {
  try {
    // Comprimir antes de subir si es un archivo de imagen
    let fileToUpload = file;
    if (file instanceof File && file.type.startsWith('image/')) {
      try {
        fileToUpload = await compressImage(file);
      } catch (e) {
        console.warn("No se pudo comprimir la imagen, subiendo original:", e);
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Error al subir imagen');
    const data = await response.json();
    return data.url;
  } catch (e: any) {
    console.error("Error subiendo imagen a Laravel:", e);
    return "https://via.placeholder.com/150"; 
  }
};

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800; // Máximo 800px para web

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/jpeg', 0.7); // 70% calidad
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
