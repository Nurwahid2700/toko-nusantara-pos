import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan',
    price: '',
    stock: '',
    image: '' // Kita pakai URL gambar saja biar cepat (Plan B)
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simpan ke Firestore
      await addDoc(collection(db, "products"), {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        image: formData.image || "https://placehold.co/400", // Default jika kosong
        createdAt: new Date()
      });
      
      alert("Produk berhasil ditambahkan!");
      setFormData({ name: '', category: 'Makanan', price: '', stock: '', image: '' }); // Reset form
      onClose(); // Tutup modal
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Gagal menambah produk");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FDFBF7] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-white/50 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#5D4037]">Tambah Produk Baru</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#8D6E63]/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-[#8D6E63]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nama Produk</label>
            <input 
              type="text" 
              required
              className="w-full p-3 rounded-xl bg-white border border-[#D7CCC8] focus:ring-2 focus:ring-[#8D6E63]/20 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Kategori</label>
              <select 
                className="w-full p-3 rounded-xl bg-white border border-[#D7CCC8] outline-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option>Makanan</option>
                <option>Minuman</option>
                <option>Sembako</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Stok Awal</label>
              <input 
                type="number" 
                required
                className="w-full p-3 rounded-xl bg-white border border-[#D7CCC8] outline-none"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Harga (Rp)</label>
            <input 
              type="number" 
              required
              className="w-full p-3 rounded-xl bg-white border border-[#D7CCC8] outline-none"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">URL Gambar</label>
            <input 
              type="text" 
              placeholder="https://..."
              className="w-full p-3 rounded-xl bg-white border border-[#D7CCC8] outline-none text-sm"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
            <p className="text-xs text-gray-400 mt-1">*Tips: Copy link gambar dari Google/Unsplash</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#8D6E63] hover:bg-[#5D4037] text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
        </form>
      </div>
    </div>
  );
}