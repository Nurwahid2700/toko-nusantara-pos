import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { X, Save } from 'lucide-react';

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
    e.preventDefault(); // Mencegah reload halaman
    
    // Validasi sederhana
    if (!formData.name || !formData.price || !formData.stock) {
      alert("Mohon isi Nama, Harga, dan Stok!");
      return;
    }

    setLoading(true);

    try {
      if (editData) {
        // --- MODE EDIT ---
        const productRef = doc(db, "products", editData.id);
        await updateDoc(productRef, {
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          stock: Number(formData.stock),
          image: formData.image || "https://placehold.co/400"
        });
        alert("✅ Produk berhasil diperbarui!");
      } else {
        // --- MODE TAMBAH BARU ---
        await addDoc(collection(db, "products"), {
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          stock: Number(formData.stock),
          image: formData.image || "https://placehold.co/400",
          createdAt: new Date()
        });
        alert("✅ Produk berhasil disimpan!");
      }
      
      onClose(); // Tutup modal setelah sukses
      setFormData(initialForm); // Reset form

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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
              <select 
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stok Awal</label>
              <input 
                type="number" 
                required
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Harga (Rp)</label>
            <input 
              type="number" 
              required
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Gambar (Opsional)</label>
            <input 
              type="text" 
              placeholder="https://..."
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#8D6E63] hover:bg-[#5D4037] text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
          >
            {loading ? 'Menyimpan...' : (
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