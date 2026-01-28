import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { X } from 'lucide-react';

// Tambahkan prop 'editData'
export default function AddProductModal({ isOpen, onClose, editData }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: 'Makanan', price: '', stock: '', image: ''
  });

  // Efek: Jika ada data edit, isi form. Jika tidak, kosongkan.
  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      setFormData({ name: '', category: 'Makanan', price: '', stock: '', image: '' });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData) {
        // Mode EDIT
        const productRef = doc(db, "products", editData.id);
        await updateDoc(productRef, {
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          stock: Number(formData.stock),
          image: formData.image
        });
        alert("Produk berhasil diperbarui!");
      } else {
        // Mode TAMBAH BARU
        await addDoc(collection(db, "products"), {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
          createdAt: new Date()
        });
        alert("Produk berhasil ditambahkan!");
      }
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan.");
    }
    setLoading(false);
  };

  // ... (SISA KODE JSX 'return' SAMA SEPERTI SEBELUMNYA, TIDAK PERLU DIUBAH BAGIAN TAMPILANNYA)
  // Cukup copy bagian logic di atas, dan pastikan tombol submit textnya dinamis:
  // {editData ? 'Update Produk' : 'Simpan Produk'}
  
  return (
      // ... (Gunakan layout modal yang lama) ...
      // Di bagian tombol Submit paling bawah ganti textnya jadi:
      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3 bg-[#8D6E63] hover:bg-[#5D4037] text-white font-bold rounded-xl shadow-lg mt-4"
      >
        {loading ? 'Menyimpan...' : (editData ? 'Update Produk' : 'Simpan Produk')}
      </button>
      // ...
  );
}