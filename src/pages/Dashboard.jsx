import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
// Pastikan path import ini sesuai dengan lokasi file firebase.js Anda
import { db } from '../lib/firebase'; 
import { LayoutDashboard, Package, DollarSign, AlertCircle, Plus } from 'lucide-react';

// Import komponen baru
import AddProductModal from '../components/AddProductModal';
import OrdersQueue from '../components/OrdersQueue';

export default function Dashboard() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); // State untuk Modal
    
    const [stats, setStats] = useState({
        totalStock: 0,
        totalValue: 0,
        lowStock: 0
    });

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);

            // Calculate stats
            const totalStock = productsData.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0);
            const totalValue = productsData.reduce((acc, curr) => acc + ((parseInt(curr.stock) || 0) * (parseInt(curr.price) || 0)), 0);
            const lowStock = productsData.filter(p => (parseInt(p.stock) || 0) < 5).length;

            setStats({ totalStock, totalValue, lowStock });
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="p-6 md:p-8 space-y-8 h-full overflow-y-auto w-full bg-[#FAFAFA]">
            {/* Header dengan Tombol Tambah Produk */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#5D4037]">Dashboard Overview</h1>
                    <p className="text-[#8D6E63]">Selamat datang kembali, pantau performa toko hari ini.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#8D6E63] hover:bg-[#5D4037] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-[#8D6E63]/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Tambah Produk
                </button>
            </header>

            {/* Stats Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#8D6E63]/10 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Aset</p>
                        <h3 className="text-2xl font-bold text-[#5D4037]">{formatCurrency(stats.totalValue)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#8D6E63]/10 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Produk</p>
                        <h3 className="text-2xl font-bold text-[#5D4037]">{products.length} Items</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#8D6E63]/10 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Stok Menipis</p>
                        <h3 className="text-2xl font-bold text-[#5D4037]">{stats.lowStock} Items</h3>
                    </div>
                </div>
            </div>

            {/* Main Content Grid: Table (Kiri) & Queue (Kanan) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
                
                {/* Kolom Kiri: Tabel Produk (Lebar 2/3) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#8D6E63]/10 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-[#5D4037] text-lg">Inventaris Produk</h3>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-[#FDFBF7] text-gray-500 font-medium text-sm">
                                <tr>
                                    <th className="px-6 py-4">Nama Produk</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Harga</th>
                                    <th className="px-6 py-4">Stok</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">Memuat data...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">Belum ada produk. Silakan tambah produk baru.</td></tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-[#FDFBF7] transition-colors group">
                                            <td className="px-6 py-4 font-medium text-[#5D4037] flex items-center gap-3">
                                                {/* Tampilkan Thumbnail Kecil */}
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden">
                                                    <img src={product.image} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src='https://placehold.co/100'} />
                                                </div>
                                                {product.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{product.category}</td>
                                            <td className="px-6 py-4 text-[#8D6E63] font-bold">{formatCurrency(product.price)}</td>
                                            <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    product.stock > 10 ? 'bg-green-100 text-green-700' :
                                                    product.stock > 0 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                    {product.stock > 10 ? 'Aman' : product.stock > 0 ? 'Menipis' : 'Habis'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kolom Kanan: Antrian Pesanan (Lebar 1/3) */}
                <div className="lg:col-span-1">
                    <OrdersQueue />
                </div>
            </div>

            {/* Modal Tambah Produk (Hidden by default) */}
            <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}