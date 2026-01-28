import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, LogOut, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'POS', icon: ShoppingCart, path: '/pos' },
    ];

    return (
        <div className="h-screen w-64 bg-white/50 backdrop-blur-md border-r border-brown/10 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
            <div className="p-8 flex items-center gap-3">
                <div className="bg-brown p-2 rounded-xl shadow-lg shadow-brown/20">
                    <Store className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-brown text-lg leading-tight">Nusantara</h1>
                    <p className="text-xs text-brown/60 font-medium">POS System</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive
                                ? 'bg-brown text-white shadow-lg shadow-brown/25'
                                : 'text-gray-500 hover:bg-brown/5 hover:text-brown'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-brown/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-all duration-300 font-medium"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
