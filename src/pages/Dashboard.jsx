import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; 
// Import tambahan: QrCode dan X icon
import { LayoutDashboard, Package, DollarSign, AlertCircle, Plus, Pencil, Trash2, CheckCircle, Clock, History, ShoppingBag, TrendingUp, QrCode, X } from 'lucide-react';

import AddProductModal from '../components/AddProductModal';

export default function Dashboard() {
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showStoreQR, setShowStoreQR] = useState(false); // State baru untuk Popup QR
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue' atau 'history'
    
    const [stats, setStats] = useState({
        revenue: 0,
        totalProducts: 0,
        lowStock: 0,
        soldToday: 0, 
        topProducts: []
    });

    // 1. Ambil Data Realtime
    useEffect(() => {
        // Fetch Produk
        const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("name")), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setProducts(data);
        });

        // Fetch Transaksi
        const unsubTrans = onSnapshot(query(collection(db, "transactions"), orderBy("createdAt", "desc")), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTransactions(data);
        });

        return () => { unsubProducts(); unsubTrans(); };
    }, []);

    // 2. Hitung Statistik Cerdas
    useEffect(() => {
        if (products.length || transactions.length) {
            // A. Filter Transaksi Selesai
            const completedTrans = transactions.filter(t => t.status === 'completed');
            
            // B. Total Pendapatan (Semua Waktu)
            const revenue = completedTrans.reduce((acc, curr) => acc + (curr.total || 0), 0);

            // C. Produk Terjual HARI INI
            const todayStr = new Date().toLocaleDateString('id-ID');
            const todayTrans = completedTrans.filter(t => t.date === todayStr);
            let soldTodayCount = 0;
            todayTrans.forEach(t => {
                if(t.items) t.items.forEach(i => soldTodayCount += i.quantity);
            });

            // D. Produk Paling Laku (Statistik)
            const salesCount = {};
            completedTrans.forEach(t => {
                if(t.items) {
                    t.items.forEach(item => {
                        salesCount[item.name] = (salesCount[item.name] || 0) + item.quantity;
                    });
                }
            });

            // Urutkan & Ambil Top 5
            const sortedProducts = Object.entries(salesCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
            
            // Cari nilai tertinggi untuk skala progress bar (100%)
            const maxSales = sortedProducts.length > 0 ? sortedProducts[0][1] : 1;

            const topProducts = sortedProducts.map(([name, qty]) => ({ 
                name, 
                qty,
                percentage: (qty / maxSales) * 100 // Hitung persentase untuk grafik
            }));

            const lowStock = products.filter(p => (parseInt(p.stock) || 0) < 5).length;

            setStats({
                revenue,
                totalProducts: products.length,
                lowStock,
                soldToday: soldTodayCount,
                topProducts
            });
            setLoading(false);
        }
    }, [products, transactions]);

    // Action Handlers
    const handleDelete = async (id) => {
        if (confirm("Hapus produk ini?")) await deleteDoc(doc(db, "products", id));
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCompleteOrder = async (id) => {
        if(confirm("Pesanan sudah diambil pelanggan?")) {
            await updateDoc(doc(db, "transactions", id), { status: 'completed' });
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    // Filter List
    const queueList = transactions.filter(t => t.status !== 'completed');
    const historyList = transactions.filter(t => t.status === 'completed');

    return (
        <div className="p-6 md:p-8 space-y-8 h-full overflow-y-auto w-full bg-[#FAFAFA]">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#5D4037]">Dashboard & Statistik</h1>
                    <p className="text-[#8D6E63]">Pantau pendapatan dan performa toko secara real-time.</p>
                </div>
                <div className="flex gap-3">
                    {/* TOMBOL BARU: LIHAT QR TOKO */}
                    <button 
                        onClick={() => setShowStoreQR(true)}
                        className="flex items-center gap-2 bg-white text-[#5D4037] border border-[#8D6E63]/20 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <QrCode size={20} /> QR Toko
                    </button>

                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#8D6E63] hover:bg-[#5D4037] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all active:scale-95">
                        <Plus size={20} /> Tambah Produk
                    </button>
                </div>
            </header>

            {/* Grid Statistik Utama */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Pendapatan */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#8D6E63]/10 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Pendapatan</p>
                        <h3 className="text-2xl font-bold text-[#5D4037]">{formatCurrency(stats.revenue)}</h3>
                    </div>
                </div>

                {/* Card 2: Terjual Hari Ini */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#8D6E63]/10 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShoppingBag size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Terjual Hari Ini</p>
                        <h3 className="text-2xl font-bold text-[#5D4037]">{stats.soldToday} <span className="text-sm text-gray-400 font-normal">Items</span></h3>
                    </div>
                </div>

                {/* Card 3: Total Produk */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#8D6E63]/10 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Package size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Produk</p>
                        <h3 className="text-2xl font-bold text-[#5D4037]">{stats.totalProducts}</h3>
                    </div>
                </div>

                {/* Card 4: Stok Menipis */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#8D6E63]/10 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Stok Menipis</p>
                        <h3 className="text-2xl font-bold text-[#5D4037]">{stats.lowStock} <span className="text-sm text-gray-400 font-normal">Items</span></h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
                
                {/* KIRI: Tabel Produk & Statistik (Gabungan) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Statistik Produk Paling Laku */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#8D6E63]/10 p-6">
                        <h3 className="font-bold text-[#5D4037] text-lg flex items-center gap-2 mb-4">
                            <TrendingUp size={20}/> Produk Paling Laku (Top 5)
                        </h3>
                        <div className="space-y-4">
                            {stats.topProducts.length > 0 ? (
                                stats.topProducts.map((p, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="flex justify-between text-sm mb-1 font-medium text-gray-700">
                                            <span>{p.name}</span>
                                            <span>{p.qty} terjual</span>
                                        </div>
                                        {/* Background Bar */}
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            {/* Progress Bar (Animasi Lebar) */}
                                            <div 
                                                className="h-full bg-[#8D6E63] rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${p.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-4">Belum ada data penjualan.</p>
                            )}
                        </div>
                    </div>

                    {/* Tabel Inventaris */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#8D6E63]/10 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-[#5D4037] text-lg">Inventaris Produk</h3></div>
                        <div className="overflow-auto max-h-[400px]">
                            <table className="w-full text-left">
                                <thead className="bg-[#FDFBF7] text-gray-500 font-medium text-sm sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Produk</th>
                                        <th className="px-6 py-4">Harga</th>
                                        <th className="px-6 py-4">Stok</th>
                                        <th className="px-6 py-4">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-[#FDFBF7] transition-colors">
                                            <td className="px-6 py-4 font-medium text-[#5D4037] flex items-center gap-3">
                                                <img src={product.image} className="w-8 h-8 rounded bg-gray-100 object-cover" onError={(e)=>e.target.src='https://placehold.co/100'}/>
                                                <div>
                                                    {product.name}
                                                    <div className="text-xs text-gray-400">{product.category}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#8D6E63] font-bold">{formatCurrency(product.price)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button onClick={() => handleEdit(product)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Pencil size={14} /></button>
                                                <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* KANAN: Antrian & Riwayat (Tabbed) */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-[#8D6E63]/10 overflow-hidden flex flex-col h-[600px] sticky top-6">
                    {/* Tab Header */}
                    <div className="flex border-b border-gray-100">
                        <button 
                            onClick={() => setActiveTab('queue')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'queue' ? 'text-[#5D4037] border-b-2 border-[#5D4037] bg-[#FDFBF7]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Clock size={16}/> Antrian ({queueList.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'text-[#5D4037] border-b-2 border-[#5D4037] bg-[#FDFBF7]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <History size={16}/> Riwayat
                        </button>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                        {(activeTab === 'queue' ? queueList : historyList).length === 0 ? (
                            <div className="text-center text-gray-400 mt-10 text-sm">Tidak ada data.</div>
                        ) : (
                            (activeTab === 'queue' ? queueList : historyList).map(order => (
                                <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-[#5D4037]">{order.customerName || 'Pelanggan'}</h4>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mr-1">
                                                {order.paymentMethod === 'qris' ? 'QRIS' : 'Cash'}
                                            </span>
                                            {activeTab === 'history' && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Selesai</span>}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[#8D6E63]">{formatCurrency(order.total)}</div>
                                            <div className="text-[10px] text-gray-400">
                                                {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* List Items Kecil */}
                                    <div className="text-xs text-gray-500 mb-3 border-t border-dashed border-gray-100 pt-2">
                                        {order.items?.map((i, idx) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{i.name}</span>
                                                <span className="font-bold">x{i.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Button (Hanya di Tab Queue) */}
                                    {activeTab === 'queue' && (
                                        <button 
                                            onClick={() => handleCompleteOrder(order.id)}
                                            className="w-full py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-green-200 transition-colors"
                                        >
                                            <CheckCircle size={14}/> Selesai / Diambil
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <AddProductModal isOpen={isModalOpen} onClose={() => {setIsModalOpen(false); setEditingProduct(null)}} editData={editingProduct} />

            {/* --- MODAL QR TOKO (Untuk Pelanggan) --- */}
            {showStoreQR && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setShowStoreQR(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                        
                        <h3 className="text-2xl font-bold text-[#5D4037] mb-2">Scan untuk Pesan</h3>
                        <p className="text-sm text-gray-500 mb-6">Pelanggan bisa scan ini untuk memesan dari HP mereka (Tanpa Install).</p>
                        
                        <div className="bg-white p-4 rounded-xl border-2 border-[#8D6E63] inline-block mb-6 shadow-inner">
                            {/* QR Code Generatis Otomatis ke Link Vercel Anda */}
                            {/* Pastikan link ini sesuai dengan domain Anda nanti */}
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://toko-nusantara-pos.vercel.app/order`} 
                                alt="QR Toko" 
                                className="w-48 h-48 mix-blend-multiply" 
                            />
                        </div>
                        
                        <div className="bg-[#FDFBF7] p-3 rounded-lg border border-[#EFEBE9] text-xs text-gray-500 mb-4 break-all">
                            https://toko-nusantara-pos.vercel.app/order
                        </div>

                        <button onClick={() => window.print()} className="w-full py-3 bg-[#8D6E63] hover:bg-[#5D4037] text-white rounded-xl font-bold shadow-lg">
                            Cetak / Print QR Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}