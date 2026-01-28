import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, ChevronDown, ChevronRight, Plus, List, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { logout } = useAuth();
    const location = useLocation();
    const [isProductMenuOpen, setIsProductMenuOpen] = useState(true); // Default terbuka

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-20">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-[#8D6E63] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#8D6E63]/20">
                    TN
                </div>
                <div>
                    <h1 className="font-bold text-[#5D4037] text-lg leading-none">Nusantara</h1>
                    <span className="text-xs text-gray-400">Point of Sales</span>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</p>
                
                <NavLink to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive('/') ? 'bg-[#8D6E63] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <LayoutDashboard size={20} /> Dashboard
                </NavLink>

                <NavLink to="/pos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive('/pos') ? 'bg-[#8D6E63] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <ShoppingCart size={20} /> Kasir / POS
                </NavLink>

                {/* Dropdown Menu Produk */}
                <div className="pt-2">
                    <button 
                        onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all font-medium"
                    >
                        <div className="flex items-center gap-3">
                            <Package size={20} /> Produk
                        </div>
                        {isProductMenuOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                    </button>

                    {/* Submenu */}
                    {isProductMenuOpen && (
                        <div className="mt-1 ml-4 border-l-2 border-gray-100 pl-2 space-y-1">
                            <NavLink to="/products" end className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${isActive('/products') ? 'text-[#8D6E63] bg-[#8D6E63]/10 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
                                <List size={16} /> Inventaris Produk
                            </NavLink>
                            {/* Link ini membuka halaman produk dengan parameter otomatis buka modal */}
                            <NavLink to="/products?action=add" className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${location.search.includes('action=add') ? 'text-[#8D6E63] bg-[#8D6E63]/10 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Plus size={16} /> Tambah Produk
                            </NavLink>
                        </div>
                    )}
                </div>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-100">
                <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm">
                    <LogOut size={18} /> Keluar Aplikasi
                </button>
            </div>
        </aside>
    );
}