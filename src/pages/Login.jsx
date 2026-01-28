import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to sign in. Please checking your email and password.');
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brown/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brown/10 rounded-full blur-[100px]" />

            <div className="w-full max-w-md p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(141,110,99,0.1)] z-10 transition-all hover:shadow-[0_8px_32px_rgba(141,110,99,0.15)]">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-brown rounded-2xl flex items-center justify-center shadow-lg shadow-brown/30 mb-4 rotate-3">
                        <Store className="text-white w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-brown">Toko Nusantara</h2>
                    <p className="text-brown/60 text-sm">Welcome back, Please login to continue</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown/80 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown/40 transition-all text-brown placeholder:text-brown/30"
                            placeholder="admin@tokonusantara.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brown/80 ml-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown/40 transition-all text-brown placeholder:text-brown/30"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-brown hover:bg-[#7D5E53] text-white rounded-xl font-medium shadow-lg shadow-brown/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
