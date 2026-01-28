import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((acc, item) => acc + (parseInt(item.price) * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "transactions"), {
                items: cart,
                total,
                cashierId: currentUser?.uid,
                timestamp: serverTimestamp(),
            });
            setCart([]);
            alert("Transaction successful!");
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Checkout failed. Try again.");
        }
        setLoading(false);
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="flex h-full gap-6 p-6">
            {/* Left: Product Grid */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-brown">Point of Sale</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-brown/20 bg-white w-64"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                    {filteredProducts.map(product => (
                        <div key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-brown/20 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="h-32 bg-cream rounded-lg mb-3 flex items-center justify-center text-brown/20 font-bold text-4xl group-hover:bg-brown/5 transition-colors">
                                {product.name.charAt(0)}
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
                            <p className="text-brown font-bold">{formatCurrency(product.price)}</p>
                            <p className="text-xs text-gray-400 mt-1">{product.stock} in stock</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart Sidebar */}
            <div className="w-96 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="font-bold text-lg text-brown flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> Current Order
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                            <ShoppingCart size={48} />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3">
                                <div className="w-16 h-16 bg-cream rounded-lg flex items-center justify-center text-brown/30 font-bold">
                                    {item.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                                    <p className="text-brown text-sm font-semibold">{formatCurrency(item.price)}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"><Minus size={14} /></button>
                                        <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-full bg-brown/10 hover:bg-brown/20 text-brown"><Plus size={14} /></button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 self-center p-2"><Trash2 size={18} /></button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500">Total</span>
                        <span className="text-2xl font-bold text-brown">{formatCurrency(total)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || loading}
                        className="w-full py-4 bg-brown hover:bg-[#7D5E53] text-white rounded-xl font-bold shadow-lg shadow-brown/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <CreditCard size={20} />
                        {loading ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}
