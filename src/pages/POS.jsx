import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, writeBatch, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, User, Wallet, QrCode, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    
    // State Baru: Checkout Info
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'qris'
    
    // State Baru: Modals
    const [showQRModal, setShowQRModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { currentUser } = useAuth();

    // 1. Ambil Data Produk
    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    // 2. Logic Keranjang (Sama seperti sebelumnya)
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity + 1 > product.stock) {
                    alert(`Stok hanya tersisa ${product.stock}!`);
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            if (product.stock <= 0) {
                alert("Stok habis!");
                return prev;
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const product = products.find(p => p.id === id);
                const newQty = item.quantity + delta;
                if (newQty > product.stock) { alert("Stok kurang!"); return item; }
                return { ...item, quantity: Math.max(1, newQty) };
            }
            return item;
        }));
    };

    const total = cart.reduce((acc, item) => acc + (parseInt(item.price) * item.quantity), 0);
    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    // 3. Logic Tombol "Bayar"
    const initiateCheckout = () => {
        if (cart.length === 0) return;
        if (!customerName.trim()) return alert("Mohon isi Nama Pelanggan!");

        if (paymentMethod === 'qris') {
            setShowQRModal(true); // Buka QR Dummy
        } else {
            processTransaction(); // Cash langsung proses
        }
    };

    // 4. Proses Simpan ke Database
    const processTransaction = async () => {
        setLoading(true);
        setShowQRModal(false); // Tutup QR jika ada

        try {
            const batch = writeBatch(db);
            const newTransactionRef = doc(collection(db, "transactions"));
            
            batch.set(newTransactionRef, {
                items: cart,
                total,
                customerName: customerName, // Simpan Nama
                paymentMethod: paymentMethod, // Simpan Metode
                cashierId: currentUser?.uid || 'guest',
                status: 'pending', 
                createdAt: serverTimestamp(),
                date: new Date().toLocaleDateString('id-ID')
            });

            cart.forEach(item => {
                const productRef = doc(db, "products", item.id);
                const currentStock = products.find(p => p.id === item.id)?.stock || 0;
                batch.update(productRef, { stock: currentStock - item.quantity });
            });

            await batch.commit();
            
            // Reset Form
            setCart([]);
            setCustomerName('');
            setPaymentMethod('cash');
            setShowSuccessModal(true); // Tampilkan Instruksi Akhir

        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Transaksi gagal.");
        }
        setLoading(false);
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 p-6 bg-[#FAFAFA] relative">
            
            {/* --- KIRI: List Produk --- */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-[#5D4037]">Menu Pesanan</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#8D6E63]/20 w-64"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
                    {filteredProducts.map(product => (
                        <div key={product.id} onClick={() => addToCart(product)}
                            className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md cursor-pointer group flex flex-col h-full border border-transparent hover:border-[#8D6E63]/30 transition-all">
                            <div className="aspect-square bg-[#FDFBF7] rounded-xl mb-3 overflow-hidden relative">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => e.target.src='https://placehold.co/200?text=No+Image'} />
                                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold ${product.stock > 0 ? 'bg-white/90 text-[#5D4037]' : 'bg-red-100 text-red-600'}`}>
                                    Stok: {product.stock}
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
                            <p className="text-[#8D6E63] font-bold">{formatCurrency(product.price)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- KANAN: Sidebar Checkout --- */}
            <div className="w-full md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-[#FDFBF7]">
                    <h2 className="font-bold text-lg text-[#5D4037] flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> Keranjang Belanja
                    </h2>
                </div>

                {/* List Item Keranjang */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                            <ShoppingCart size={48} />
                            <p>Keranjang Kosong</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 bg-gray-50 p-2 rounded-xl items-center">
                                <img src={item.image} className="w-12 h-12 rounded-lg object-cover border border-gray-200" onError={(e) => e.target.src='https://placehold.co/100'}/>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                                    <p className="text-[#8D6E63] text-xs font-bold">{formatCurrency(item.price)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded"><Minus size={12}/></button>
                                        <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-[#8D6E63]/10 hover:text-[#8D6E63] rounded"><Plus size={12}/></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Form Data Pelanggan & Pembayaran */}
                <div className="p-5 bg-white border-t border-gray-100 space-y-4">
                    {/* Input Nama */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Pelanggan</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Masukkan nama..." 
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#8D6E63] text-sm font-medium"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Pilihan Pembayaran */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Metode Pembayaran</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === 'cash' ? 'bg-[#8D6E63] text-white border-[#8D6E63]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Wallet size={16} /> Cash
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('qris')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === 'qris' ? 'bg-[#8D6E63] text-white border-[#8D6E63]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <QrCode size={16} /> QRIS
                            </button>
                        </div>
                    </div>

                    {/* Total & Checkout */}
                    <div className="pt-2 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 font-medium">Total Tagihan</span>
                            <span className="text-xl font-bold text-[#5D4037]">{formatCurrency(total)}</span>
                        </div>
                        <button
                            onClick={initiateCheckout}
                            disabled={cart.length === 0 || loading}
                            className="w-full py-3.5 bg-[#8D6E63] hover:bg-[#5D4037] text-white rounded-xl font-bold shadow-lg shadow-[#8D6E63]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <CreditCard size={18} />
                            {loading ? 'Memproses...' : 'Bayar Sekarang'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL 1: QRIS Dummy --- */}
            {showQRModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
                        <h3 className="text-xl font-bold text-[#5D4037] mb-1">Scan QRIS</h3>
                        <p className="text-sm text-gray-500 mb-6">Scan kode di bawah untuk membayar</p>
                        
                        <div className="bg-white p-4 rounded-xl border-2 border-[#8D6E63] inline-block mb-6 shadow-inner">
                            {/* Gambar QR Dummy */}
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SimulasiPembayaranTokoNusantara" alt="QRIS" className="w-48 h-48 mix-blend-multiply" />
                        </div>
                        
                        <div className="text-2xl font-bold text-[#5D4037] mb-6">{formatCurrency(total)}</div>
                        
                        <button onClick={processTransaction} className="w-full py-3 bg-[#8D6E63] hover:bg-[#5D4037] text-white rounded-xl font-bold shadow-lg">
                            Simulasi Transaksi Berhasil
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: Instruksi Sukses --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#5D4037] mb-2">Pesanan Diterima!</h3>
                        
                        <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#EFEBE9] mb-6 text-left">
                            <p className="text-sm text-gray-500 mb-1">Status Pembayaran:</p>
                            <p className="font-bold text-[#5D4037] flex items-center gap-2 mb-3">
                                {paymentMethod === 'cash' ? <Wallet size={16}/> : <QrCode size={16}/>}
                                {paymentMethod === 'cash' ? 'Tunai (Cash)' : 'QRIS (Lunas)'}
                            </p>
                            <div className="h-px bg-gray-200 mb-3"></div>
                            <p className="text-sm text-gray-800 font-medium">
                                {paymentMethod === 'cash' 
                                    ? "Silakan lakukan pembayaran di kasir saat nomor antrian Anda dipanggil." 
                                    : "Pembayaran berhasil. Silakan tunggu panggilan pengambilan pesanan."}
                            </p>
                        </div>

                        <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold">
                            Tutup & Buat Pesanan Baru
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}