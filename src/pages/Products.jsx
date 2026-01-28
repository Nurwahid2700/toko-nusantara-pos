import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; 
import { Package, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom'; // Untuk baca ?action=add

import AddProductModal from '../components/AddProductModal';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Cek URL params (untuk menu "Tambah Produk" di sidebar)
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Jika link sidebar "Tambah Produk" diklik, otomatis buka modal
        if (searchParams.get('action') === 'add') {
            setIsModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setProducts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (confirm("Yakin ingin menghapus produk ini?")) {
            await deleteDoc(doc(db, "products", id));
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    // FORMAT HARGA: "10.000" (Tanpa Rp jika ingin lebih bersih, atau pakai currency style)
    const formatPrice = (val) => {
        return new Intl.NumberFormat('id-ID', { 
            minimumFractionDigits: 0 
        }).format(val);
    };

    // Filter Pencarian
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 h-full overflow-y-auto bg-[#FAFAFA]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#5D4037] flex items-center gap-2">
                        <Package /> Manajemen Produk
                    </h1>
                    <p className="text-gray-500 text-sm">Kelola stok dan daftar menu toko Anda.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="bg-[#8D6E63] hover:bg-[#5D4037] text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus size={20} /> Tambah Produk Baru
                </button>
            </div>

            {/* Tabel Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search Bar di atas tabel */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-[#FDFBF7]">
                    <Search className="text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Cari nama produk..." 
                        className="bg-transparent outline-none flex-1 text-sm font-medium text-[#5D4037]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Gambar & Nama</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Harga (Rp)</th>
                                <th className="px-6 py-4">Stok</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={product.image} className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200" onError={(e) => e.target.src='https://placehold.co/100'} />
                                            <span className="font-bold text-[#5D4037]">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{product.category}</td>
                                    <td className="px-6 py-4 font-bold text-[#8D6E63]">
                                        {formatPrice(product.price)} {/* Format 10.000 */}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {product.stock} Unit
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex justify-center gap-2">
                                        <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={16}/></button>
                                        <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddProductModal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false); 
                    setEditingProduct(null);
                    // Hapus query param agar jika di-refresh tidak kebuka terus
                    window.history.replaceState({}, '', '/products');
                }} 
                editData={editingProduct} 
            />
        </div>
    );
}