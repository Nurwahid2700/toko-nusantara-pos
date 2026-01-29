import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { X, Save, UploadCloud, Loader2 } from 'lucide-react'; // Tambahkan icon yang kurang

export default function AddProductModal({ isOpen, onClose, editData }) {
  const [loading, setLoading] = useState(false);
  
  // Default data form
  const initialForm = {
    name: '',
    category: 'Makanan',
    price: '',
    stock: '',
    image: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // Efek: Isi form jika mode Edit, kosongkan jika mode Tambah
  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData(initialForm);
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    // Validasi sederhana
    if (!formData.name || !formData.price || !formData.stock) {
      alert("Mohon isi Nama, Harga, dan Stok!");
      return;
    }

    setLoading(true);

    try {
      // Pastikan harga dan stok disimpan sebagai ANGKA (Integer)
      const dataToSave = {
        name: formData.name,
        category: formData.category,
        price: parseInt(formData.price), // Pastikan angka murni
        stock: parseInt(formData.stock),
        image: formData.image || "https://placehold.co/400"
      };

      if (editData) {
        // --- MODE EDIT ---
        const productRef = doc(db, "products", editData.id);
        await updateDoc(productRef, dataToSave);
        // alert("✅ Produk berhasil diperbarui!"); // Opsional, bisa dihapus agar cepat
      } else {
        // --- MODE TAMBAH BARU ---
        await addDoc(collection(db, "products"), {
          ...dataToSave,
          createdAt: new Date()
        });
        // alert("✅ Produk berhasil disimpan!"); // Opsional
      }
      
      onClose(); 
      setFormData(initialForm); 

    } catch (error) {
      console.error("Error saving product:", error);
      alert(`❌ Gagal menyimpan: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Modal */}
        <div className="bg-[#5D4037] p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold">{editData ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Produk</label>
            <input 
              type="text" 
              required
              placeholder="Contoh: Nasi Goreng Spesial"
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#8D6E63] outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Harga (Rupiah)</label>
              <div className="relative">
                {/* Tambahan UI: Prefix Rp */}
                <span className="absolute left-3 top-3 text-gray-400 font-bold text-sm">Rp</span>
                <input 
                  type="number" 
                  required
                  placeholder="15000"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#8D6E63]"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stok Awal</label>
              <input 
                type="number" 
                required
                placeholder="50"
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#8D6E63]"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
            <select 
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#8D6E63]"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Makanan</option>
              <option>Minuman</option>
              <option>Camilan</option>
              <option>Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Gambar (URL)</label>
            <div className="flex gap-2">
                <input 
                type="text" 
                placeholder="https://..."
                className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm focus:border-[#8D6E63]"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                />
                {/* Tambahan UI: Kotak Preview Gambar */}
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                    {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                        <UploadCloud size={20} className="text-gray-400"/>
                    )}
                </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#8D6E63] hover:bg-[#5D4037] text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <Save size={18} />
                {editData ? 'Simpan Perubahan' : 'Simpan Produk'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}