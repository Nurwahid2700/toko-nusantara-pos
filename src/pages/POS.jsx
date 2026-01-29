import React, { useEffect, useState } from 'react';

import { collection, onSnapshot, writeBatch, doc, serverTimestamp, query, orderBy, getDocs, limit } from 'firebase/firestore';

import { db } from '../lib/firebase';

import { Search, ShoppingCart, Plus, Minus, Trash2, Wallet, QrCode, X, CheckCircle, Ticket, Printer, FileText } from 'lucide-react';

import { useAuth } from '../context/AuthContext';



export default function POS() {

const [products, setProducts] = useState([]);

const [cart, setCart] = useState([]);

const [search, setSearch] = useState('');

const [loading, setLoading] = useState(false);


// State Form

const [customerName, setCustomerName] = useState('');

const [note, setNote] = useState('');

const [paymentMethod, setPaymentMethod] = useState('cash');


// Modals

const [showQRModal, setShowQRModal] = useState(false);

const [showSuccessModal, setShowSuccessModal] = useState(false);

const [lastTransaction, setLastTransaction] = useState(null);



const { currentUser } = useAuth();



useEffect(() => {

const q = query(collection(db, "products"), orderBy("name"));

const unsubscribe = onSnapshot(q, (snapshot) => {

setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

});

return () => unsubscribe();

}, []);



const addToCart = (product) => { setCart(prev => { const existing = prev.find(item => item.id === product.id); if (existing) { if (existing.quantity + 1 > product.stock) { alert(`Stok sisa ${product.stock}`); return prev; } return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); } if (product.stock <= 0) { alert("Stok habis"); return prev; } return [...prev, { ...product, quantity: 1 }]; }); };

const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

const updateQuantity = (id, delta) => { setCart(prev => prev.map(item => { if (item.id === id) { const product = products.find(p => p.id === id); const newQty = item.quantity + delta; if (newQty > product.stock) { alert("Stok kurang"); return item; } return { ...item, quantity: Math.max(1, newQty) }; } return item; })); };


// --- HARGA NORMAL (TIDAK DIKALI 1000 LAGI) ---

const total = cart.reduce((acc, item) => acc + (parseInt(item.price) * item.quantity), 0);


const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);



const initiateCheckout = () => {

if (cart.length === 0) return;

if (!customerName.trim()) return alert("Isi Nama Pelanggan!");

if (paymentMethod === 'qris') setShowQRModal(true);

else processTransaction();

};



const getNextQueueNumber = async () => {

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

return String(nextNum).padStart(3, '0');

} catch (error) { return String(Math.floor(Math.random() * 999)).padStart(3, '0'); }

};



const processTransaction = async () => {

setLoading(true);

setShowQRModal(false);



try {

const numberStr = await getNextQueueNumber();

const queueCode = `A-${numberStr}`;



const transactionData = {

items: cart,

total,

customerName: customerName,

note: note,

paymentMethod: paymentMethod,

cashierId: currentUser?.uid || 'guest',

status: 'pending',

queueNumber: queueCode,

createdAt: serverTimestamp(),

date: new Date().toLocaleDateString('id-ID'),

time: new Date().toLocaleTimeString('id-ID'),

orderType: 'dine_in' // Default Kasir adalah Dine In

};



const batch = writeBatch(db);

const newTransactionRef = doc(collection(db, "transactions"));

batch.set(newTransactionRef, transactionData);



cart.forEach(item => {

const productRef = doc(db, "products", item.id);

const currentStock = products.find(p => p.id === item.id)?.stock || 0;

batch.update(productRef, { stock: currentStock - item.quantity });

});



await batch.commit();

setLastTransaction({ ...transactionData, id: newTransactionRef.id });


setCart([]);

setCustomerName('');

setNote('');

setPaymentMethod('cash');

setShowSuccessModal(true);

} catch (error) {

console.error("Error:", error);

alert("Transaksi gagal.");

}

setLoading(false);

};



const handlePrint = () => {

const printContent = document.getElementById('receipt-print-area').innerHTML;

const originalContent = document.body.innerHTML;

document.body.innerHTML = printContent;

window.print();

document.body.innerHTML = originalContent;

window.location.reload();

};



const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));



return (

<div className="flex flex-col md:flex-row h-full gap-6 p-6 bg-[#FAFAFA] relative">

<div className="flex-1 flex flex-col gap-6 overflow-hidden">

<div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-[#5D4037]">Menu Pesanan</h1><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Cari produk..." className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none w-64" value={search} onChange={e => setSearch(e.target.value)} /></div></div>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">{filteredProducts.map(product => (<div key={product.id} onClick={() => addToCart(product)} className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md cursor-pointer group flex flex-col h-full border border-transparent hover:border-[#8D6E63]/30"><div className="aspect-square bg-[#FDFBF7] rounded-xl mb-3 overflow-hidden relative"><img src={product.image} className="w-full h-full object-cover" onError={(e) => e.target.src='https://placehold.co/200'} /><div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold ${product.stock > 0 ? 'bg-white/90 text-[#5D4037]' : 'bg-red-100 text-red-600'}`}>{product.stock}</div></div><h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{product.name}</h3><p className="text-[#8D6E63] font-bold">{formatCurrency(product.price)}</p></div>))}</div>

</div>



<div className="w-full md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[calc(100vh-3rem)] overflow-hidden">

<div className="p-5 border-b border-gray-100 bg-[#FDFBF7]"><h2 className="font-bold text-lg text-[#5D4037] flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Keranjang</h2></div>

<div className="flex-1 overflow-y-auto p-4 space-y-4">{cart.map(item => (<div key={item.id} className="flex gap-3 bg-gray-50 p-2 rounded-xl items-center"><img src={item.image} className="w-12 h-12 rounded-lg object-cover" onError={(e)=>e.target.src='https://placehold.co/100'}/><div className="flex-1 min-w-0"><h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4><p className="text-[#8D6E63] text-xs font-bold">{formatCurrency(item.price)}</p></div><div className="flex flex-col items-end gap-1"><button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button><div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm"><button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded"><Minus size={12}/></button><span className="font-bold text-xs w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-[#8D6E63]/10 text-[#8D6E63] rounded"><Plus size={12}/></button></div></div></div>))}</div>


<div className="p-5 bg-white border-t border-gray-100 space-y-4">

<div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Pelanggan</label><input type="text" placeholder="Masukkan nama..." className="w-full pl-4 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>

<div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Catatan (Opsional)</label><textarea placeholder="Contoh: Pedas, Tanpa bawang..." className="w-full pl-4 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm resize-none" rows="2" value={note} onChange={(e) => setNote(e.target.value)} /></div>

<div className="grid grid-cols-2 gap-2"><button onClick={() => setPaymentMethod('cash')} className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border ${paymentMethod === 'cash' ? 'bg-[#8D6E63] text-white' : 'bg-white'}`}><Wallet size={16} /> Cash</button><button onClick={() => setPaymentMethod('qris')} className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border ${paymentMethod === 'qris' ? 'bg-[#8D6E63] text-white' : 'bg-white'}`}><QrCode size={16} /> QRIS</button></div>

<div className="pt-2 border-t border-dashed border-gray-200"><div className="flex justify-between items-center mb-4"><span className="text-gray-500 font-medium">Total</span><span className="text-xl font-bold text-[#5D4037]">{formatCurrency(total)}</span></div><button onClick={initiateCheckout} disabled={cart.length === 0 || loading} className="w-full py-3.5 bg-[#8D6E63] text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">{loading ? 'Proses...' : 'Bayar'}</button></div>

</div>

</div>



{showQRModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative"><button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4"><X size={16}/></button><h3 className="text-xl font-bold text-[#5D4037] mb-6">Scan QRIS</h3><div className="bg-white p-4 rounded-xl border-2 border-[#8D6E63] inline-block mb-6"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SimulasiBayar" className="w-48 h-48 mix-blend-multiply" /></div><button onClick={processTransaction} className="w-full py-3 bg-[#8D6E63] text-white rounded-xl font-bold shadow-lg">Simulasi Sukses</button></div></div>)}


{showSuccessModal && lastTransaction && (

<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

<div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in">

<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-green-600" /></div>

<h3 className="text-xl font-bold text-[#5D4037] mb-1">Pembayaran Berhasil!</h3>

<p className="text-sm text-gray-500 mb-6">Terima kasih Kak {lastTransaction.customerName}</p>


<div className="bg-[#FDFBF7] p-6 rounded-2xl border-2 border-dashed border-[#8D6E63]/30 mb-6 relative overflow-hidden">

<p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nomor Antrian</p>

<div className="text-5xl font-black text-[#5D4037] tracking-tight">{lastTransaction.queueNumber}</div>

<div className="mt-2 text-[10px] text-gray-400 flex items-center justify-center gap-1"><Ticket size={12} /> Tunjukkan saat dipanggil</div>

</div>



<div className="flex gap-2">

<button onClick={handlePrint} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold flex items-center justify-center gap-2"><Printer size={18} /> Cetak Struk</button>

<button onClick={() => setShowSuccessModal(false)} className="flex-1 py-3 bg-[#8D6E63] text-white rounded-xl font-bold shadow-lg">Transaksi Baru</button>

</div>


{/* INVOICE HIDDEN */}

<div id="receipt-print-area" className="hidden">

<div style={{ padding: '20px', fontFamily: 'monospace', textAlign: 'center', width: '300px', margin: '0 auto' }}>

<h2 style={{ marginBottom: '5px' }}>Toko Nusantara</h2>

<p style={{ fontSize: '12px', margin: 0 }}>Jl. Contoh No. 123, Jakarta</p>

<p style={{ fontSize: '12px', margin: 0 }}>--------------------------------</p>

<div style={{ textAlign: 'left', margin: '10px 0', fontSize: '12px' }}>

<p>Tgl: {lastTransaction.date} {lastTransaction.time}</p>

<p>No: {lastTransaction.queueNumber}</p>

<p>Plg: {lastTransaction.customerName}</p>

</div>

<p style={{ fontSize: '12px', margin: 0 }}>--------------------------------</p>

<div style={{ textAlign: 'left', fontSize: '12px' }}>

{lastTransaction.items.map((item, idx) => (

<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>

<span>{item.name} x{item.quantity}</span>

<span>{formatCurrency(item.price * item.quantity)}</span>

</div>

))}

</div>

<p style={{ fontSize: '12px', margin: 0 }}>--------------------------------</p>

<div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '10px 0' }}>

<span>TOTAL</span>

<span>{formatCurrency(lastTransaction.total)}</span>

</div>

{lastTransaction.note && (<div style={{ textAlign: 'left', fontSize: '12px', marginTop: '10px' }}><p style={{ fontWeight: 'bold', margin: 0 }}>Catatan:</p><p style={{ margin: 0 }}>{lastTransaction.note}</p></div>)}

<p style={{ fontSize: '12px', marginTop: '20px' }}>Terima Kasih atas Kunjungan Anda!</p>

</div>

</div>



</div>

</div>

)}

</div>

);

}