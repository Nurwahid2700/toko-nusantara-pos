import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShoppingBag, Search, Minus, Plus, X, ArrowRight, ChefHat, Ticket, Info, FileText } from 'lucide-react';

export default function UserOrder() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Semua');
    
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [note, setNote] = useState(''); // <--- STATE CATATAN
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [queueNumber, setQueueNumber] = useState('');

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(data.filter(p => p.stock > 0));
        });
        return () => unsubscribe();
    }, []);

    const addToCart = (product) => { setCart(prev => { const existing = prev.find(item => item.id === product.id); if (existing) { if (existing.quantity + 1 > product.stock) return prev; return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); } return [...prev, { ...product, quantity: 1 }]; }); };
    const updateQty = (id, delta) => { setCart(prev => prev.map(item => { if (item.id === id) return { ...item, quantity: Math.max(0, item.quantity + delta) }; return item; }).filter(item => item.quantity > 0)); };
    const total = cart.reduce((acc, item) => acc + (parseInt(item.price) * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        if (!customerName || cart.length === 0) return;
        setLoading(true);

        try {
            const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(1));
            const querySnapshot = await getDocs(q);
            let nextNum = 1;
            if (!querySnapshot.empty) {
                const lastTx = querySnapshot.docs[0].data();
                const lastCode = lastTx.queueNumber || "000";
                const parts = lastCode.split('-'); 
                if (parts.length > 1) {
                    const numPart = parseInt(parts[1]);
                    if (!isNaN(numPart)) nextNum = numPart + 1;
                }
            }
            const nextNumStr = String(nextNum).padStart(3, '0');
            const qCode = `Q-${nextNumStr}`;
            
            setQueueNumber(qCode);

            await addDoc(collection(db, "transactions"), {
                items: cart,
                total: total,
                customerName: customerName,
                note: note, // <--- SIMPAN CATATAN
                paymentMethod: 'pending_cashier',
                status: 'pending',
                queueNumber: qCode,
                type: 'online_order',
                createdAt: serverTimestamp(),
                date: new Date().toLocaleDateString('id-ID'),
                time: new Date().toLocaleTimeString('id-ID')
            });

            setOrderSuccess(true);
            setCart([]);
            setNote('');
        } catch (error) {
            console.error(error);
            alert("Gagal mengirim pesanan");
        }
        setLoading(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    const categories = ['Semua', ...new Set(products.map(p => p.category))];
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (category === 'Semua' || p.category === category));

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce"><ChefHat className="w-12 h-12 text-green-600" /></div>
                <h1 className="text-2xl font-bold text-[#5D4037] mb-2">Pesanan Diterima!</h1>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 max-w-xs text-left"><p className="text-blue-800 text-sm font-medium flex gap-2"><Info size={24} className="flex-shrink-0" />Pesanan akan segera disiapkan. Mohon untuk bersiap ke <b>Toko Ritel Nusantara</b> dan ambil pesanan Anda.</p></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 w-full max-w-xs relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-[#8D6E63]"></div><p className="text-xs font-bold text-gray-400 uppercase mb-2">Nomor Antrian Kamu</p><div className="text-5xl font-black text-[#5D4037] tracking-tighter">{queueNumber}</div><div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 py-2 rounded-lg"><Ticket size={14}/> Tunjukkan ke Kasir</div></div>
                <button onClick={() => {setOrderSuccess(false); setCustomerName(''); setIsCartOpen(false)}} className="px-8 py-3 bg-[#8D6E63] text-white rounded-xl font-bold shadow-lg">Pesan Lagi</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-24 max-w-md mx-auto shadow-2xl overflow-hidden relative">
            <header className="bg-white p-4 sticky top-0 z-10 shadow-sm"><div className="flex justify-between items-center mb-4"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#8D6E63] rounded-lg flex items-center justify-center text-white font-bold text-xs">TN</div><h1 className="font-bold text-[#5D4037]">Toko Nusantara</h1></div>{totalItems > 0 && (<button onClick={() => setIsCartOpen(true)} className="relative p-2 text-[#8D6E63]"><ShoppingBag /><span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{totalItems}</span></button>)}</div><div className="space-y-3"><div className="relative"><Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" /><input type="text" placeholder="Cari menu favorit..." className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#8D6E63]/20" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{categories.map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${category === cat ? 'bg-[#5D4037] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>{cat}</button>))}</div></div></header>
            <div className="p-4 grid grid-cols-2 gap-4">{filteredProducts.map(product => (<div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-transparent hover:border-[#8D6E63]/20 transition-all flex flex-col"><div className="aspect-square bg-[#FDFBF7] rounded-xl mb-3 overflow-hidden relative"><img src={product.image} className="w-full h-full object-cover" onError={(e) => e.target.src='https://placehold.co/200'} /></div><h3 className="font-bold text-gray-800 text-sm truncate mb-1">{product.name}</h3><div className="mt-auto flex justify-between items-center"><span className="text-[#8D6E63] font-bold text-sm">{formatCurrency(product.price)}</span><button onClick={() => addToCart(product)} className="w-7 h-7 bg-[#FDFBF7] text-[#5D4037] rounded-full flex items-center justify-center hover:bg-[#8D6E63] hover:text-white transition-colors"><Plus size={16} /></button></div></div>))}</div>
            {totalItems > 0 && !isCartOpen && (<div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto"><button onClick={() => setIsCartOpen(true)} className="w-full bg-[#5D4037] text-white p-4 rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom duration-300"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">{totalItems}</div><span className="font-medium text-sm">item di keranjang</span></div><div className="flex items-center gap-2 font-bold">{formatCurrency(total)} <ArrowRight size={18} /></div></button></div>)}
            {isCartOpen && (<div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm"><div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"><div className="p-5 border-b border-gray-100 flex justify-between items-center"><h2 className="font-bold text-lg text-[#5D4037]">Pesanan Kamu</h2><button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-5 space-y-4">{cart.map(item => (<div key={item.id} className="flex gap-4 items-center"><img src={item.image} className="w-14 h-14 rounded-lg object-cover bg-gray-50" onError={(e)=>e.target.src='https://placehold.co/100'}/><div className="flex-1"><h4 className="font-bold text-sm text-gray-800">{item.name}</h4><p className="text-[#8D6E63] text-xs font-bold">{formatCurrency(item.price)}</p></div><div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1"><button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600"><Minus size={14}/></button><span className="text-xs font-bold w-4 text-center">{item.quantity}</span><button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-[#8D6E63] text-white rounded shadow-sm"><Plus size={14}/></button></div></div>))}</div>
            
            <div className="p-6 bg-[#FDFBF7] border-t border-gray-100 rounded-b-3xl">
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                    <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Pemesan</label><input required type="text" placeholder="Contoh: Budi" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#8D6E63]" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
                    
                    {/* INPUT CATATAN BARU */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Catatan Pesanan</label>
                        <textarea 
                            placeholder="Contoh: Jangan terlalu pedas..." 
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#8D6E63] text-sm resize-none" 
                            rows="2"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-2 text-lg font-bold text-[#5D4037]"><span>Total Bayar</span><span>{formatCurrency(total)}</span></div><button type="submit" disabled={loading} className="w-full py-4 bg-[#8D6E63] text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-[#5D4037] transition-all">{loading ? 'Mengirim...' : 'Kirim Pesanan Sekarang'}</button></form></div></div></div>)}
        </div>
    );
}