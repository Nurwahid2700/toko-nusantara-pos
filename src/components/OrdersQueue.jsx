import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { CheckCircle, Clock } from 'lucide-react';

export default function OrdersQueue() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Ambil transaksi yang statusnya BUKAN 'completed' (misal: pending atau process)
    // Note: Jika error index di console, hapus orderBy sementara
    const q = query(
      collection(db, "transactions"),
      where("status", "!=", "completed"), 
      orderBy("status"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleComplete = async (id) => {
    if(confirm("Pesanan sudah selesai diambil?")) {
      const orderRef = doc(db, "transactions", id);
      await updateDoc(orderRef, { status: "completed" });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-full">
      <h3 className="text-lg font-bold text-[#5D4037] mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Antrian Pesanan
      </h3>

      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 py-4">Tidak ada antrian aktif.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 rounded-xl bg-[#FDFBF7] border border-[#EFEBE9] hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <h4 className="font-bold text-gray-800 mt-1">Order #{order.id.slice(-4)}</h4>
                </div>
                <p className="font-bold text-[#8D6E63]">Rp {order.total?.toLocaleString()}</p>
              </div>
              
              <div className="text-sm text-gray-500 mb-3">
                {order.items?.length} Barang • {new Date(order.createdAt?.seconds * 1000).toLocaleTimeString()}
              </div>

              <button 
                onClick={() => handleComplete(order.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Selesai / Diambil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}