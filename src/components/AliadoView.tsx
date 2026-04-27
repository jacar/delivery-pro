import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Aliado, Producto } from '../types';
import { listenAliados, actualizarAliado, subirImagen } from '../services/aliadoService';
import { Store, ImagePlus, Loader2, Plus, Package, Pencil, Trash2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { formatImageUrl } from '../services/apiConfig';

export default function AliadoView() {
  const { userData } = useAuth();
  const [aliado, setAliado] = useState<Aliado | null>(null);
  const [loading, setLoading] = useState(true);

  // States for mini-form
  const [pNombre, setPNombre] = useState('');
  const [pPrecio, setPPrecio] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pImagen, setPImagen] = useState<string | null>(null);
  const [pImageFile, setPImageFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductoId, setEditingProductoId] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.email) return;

    const unsub = listenAliados((allAliados) => {
      // Encontramos el aliado que le pertenece a este usuario
      const myAliado = allAliados.find(a => a.ownerEmail === userData.email);
      setAliado(myAliado || null);
      setLoading(false);
    });

    return () => unsub();
  }, [userData?.email]);

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPImagen(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const editProducto = (p: Producto) => {
    setEditingProductoId(p.id);
    setPNombre(p.nombre);
    setPPrecio(p.precio);
    setPDesc(p.descripcion || '');
    setPImagen(p.imagenUrl || null);
    setPImageFile(null); // Clear new file when editing to avoid uploading if unchanged
  };

  const removeProducto = async (id: string) => {
    if (!aliado) return;
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      const nuevosProductos = (aliado.productos || []).filter(p => p.id !== id);
      try {
        await actualizarAliado(aliado.id, { productos: nuevosProductos });
        toast.success('Producto eliminado');
      } catch (e) {
        toast.error('Error al eliminar producto');
      }
    }
  };

  const addOrUpdateProducto = async () => {
    if (!aliado) return;
    if (!pNombre || !pPrecio) {
      toast.error('Nombre y Precio son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = pImagen || '';
      if (pImageFile) {
        const path = `aliados/productos/${Date.now()}_${pImageFile.name}`;
        finalImageUrl = await subirImagen(path, pImageFile);
      }

      let nuevosProductos = [...(aliado.productos || [])];

      if (editingProductoId) {
        nuevosProductos = nuevosProductos.map(p => {
          if (p.id === editingProductoId) {
            return {
              ...p,
              nombre: pNombre,
              precio: pPrecio,
              descripcion: pDesc,
              imagenUrl: finalImageUrl
            };
          }
          return p;
        });
      } else {
        const nuevo: Producto = {
          id: Math.random().toString(36).substr(2, 9),
          nombre: pNombre,
          precio: pPrecio,
          descripcion: pDesc,
          imagenUrl: finalImageUrl
        };
        nuevosProductos.push(nuevo);
      }

      await actualizarAliado(aliado.id, { productos: nuevosProductos });
      toast.success(editingProductoId ? 'Producto actualizado' : 'Producto añadido');
      
      // Reset form
      setPNombre('');
      setPPrecio('');
      setPDesc('');
      setPImagen(null);
      setPImageFile(null);
      setEditingProductoId(null);
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!aliado) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Store size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">No tienes un comercio asignado</h2>
        <p className="text-sm text-gray-500 mt-2">Contacta al administrador para que vincule tu cuenta con tu negocio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-gray-50 flex items-center gap-6">
        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] overflow-hidden shadow-inner shrink-0 leading-[0]">
          <img src={formatImageUrl(aliado.logoUrl)} alt={aliado.nombre} className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{aliado.nombre}</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{aliado.descripcion || 'Sin categoría'}</p>
          {aliado.whatsapp && (
            <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1">
              <Phone size={12} /> {aliado.whatsapp}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.05)] border border-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
               Mi Menú de Productos
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestiona los platos de tu comercio</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
            <Package size={14} className="text-orange-500" />
            <span className="text-xs font-black text-gray-900">{(aliado.productos || []).length}/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {(aliado.productos || []).map((prod) => (
            <div 
              key={prod.id} 
              className={`flex items-center gap-4 p-4 rounded-3xl border transition-all group relative ${
                editingProductoId === prod.id ? 'bg-orange-50 border-orange-200 shadow-lg' : 'bg-gray-50 border-gray-100 hover:bg-white'
              }`}
            >
              <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm shrink-0 border border-gray-50">
                {prod.imagenUrl ? <img src={formatImageUrl(prod.imagenUrl)} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-4 text-gray-200" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{prod.nombre}</p>
                <p className="text-xs font-bold text-orange-500">$ {Number(prod.precio).toFixed(2)}</p>
              </div>
              <div className={`flex gap-2 transition-opacity ${editingProductoId === prod.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button 
                  onClick={() => editProducto(prod)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    editingProductoId === prod.id ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500 hover:bg-orange-500 hover:text-white'
                  }`}
                  title="Editar Producto"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => removeProducto(prod.id)}
                  className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  title="Eliminar Producto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {(aliado.productos || []).length < 100 && (
          <div className={`p-6 md:p-8 rounded-[3rem] border transition-all space-y-6 ${
            editingProductoId ? 'bg-orange-50/50 border-orange-200 shadow-inner' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Nombre Producto</label>
                <input 
                  type="text" value={pNombre} onChange={(e) => setPNombre(e.target.value)}
                  className="w-full px-6 py-4 bg-white border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" 
                  placeholder="Ej: Pizza Familiar"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Precio ($)</label>
                <input 
                  type="text" value={pPrecio} onChange={(e) => setPPrecio(e.target.value)}
                  className="w-full px-6 py-4 bg-white border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" 
                  placeholder="Ej: 12.99"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Descripción / Promo</label>
                <textarea 
                  rows={1} value={pDesc} onChange={(e) => setPDesc(e.target.value)}
                  className="w-full px-6 py-4 bg-white border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-orange-500/10 outline-none resize-none transition-all shadow-sm" 
                  placeholder="Breve detalle del producto..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => document.getElementById('prod-img-input')?.click()}
                  className="w-20 h-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-orange-500 transition-all flex items-center justify-center cursor-pointer group overflow-hidden shadow-sm"
                >
                  {pImagen ? <img src={formatImageUrl(pImagen)} className="w-full h-full object-cover" /> : <ImagePlus size={20} className="text-gray-200 group-hover:text-orange-500" />}
                  <input id="prod-img-input" type="file" accept="image/*" onChange={handleProductImageChange} className="hidden" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Imagen del Producto</p>
                  <button 
                    type="button"
                    onClick={() => document.getElementById('prod-img-input')?.click()}
                    className="text-xs font-bold text-orange-500 hover:underline"
                  >
                    {pImagen ? 'Cambiar Imagen' : 'Subir Imagen'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {editingProductoId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingProductoId(null);
                      setPNombre(''); setPPrecio(''); setPDesc(''); setPImagen(null); setPImageFile(null);
                    }}
                    className="px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  type="button"
                  onClick={addOrUpdateProducto}
                  disabled={isSubmitting}
                  className="bg-gray-900 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center gap-3 shadow-xl shadow-gray-200 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : editingProductoId ? <><Pencil size={14} /> Actualizar</> : <><Plus size={14} /> Añadir</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
