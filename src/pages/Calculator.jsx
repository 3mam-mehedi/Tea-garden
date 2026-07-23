import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  RotateCcw,
  Receipt,
} from "lucide-react";

const products = [
  { id: 1, name: "রং চা", price: 10, image: "/assets/products/rong.png" },
  { id: 2, name: "লেবু চা", price: 10, image: "/assets/products/lebu.png" },
  { id: 3, name: "দুধ চা", price: 20, image: "/assets/products/milk.jpg" },
  { id: 4, name: "স্পেশাল দুধ চা", price: 30, image: "/assets/products/special.jpg" },
  { id: 5, name: "মালাই চা", price: 50, image: "/assets/products/malai.jpg" },
  { id: 6, name: "কফি(হাফ)", price: 30, image: "/assets/products/coffee.jpg" },
  { id: 7, name: "কফি(ফুল)", price: 50, image: "/assets/products/coffe.jpg" },
  { id: 8, name: "পোড়ারুটি", price: 30, image: "/assets/products/ruti.png" },
  { id: 9, name: "চিপস", price: 10, image: "/assets/products/bombay.jpg" },
  { id: 10, name: "ইস্ট চিপস", price: 10, image: "/assets/products/east.jpg" },
  { id: 11, name: "চিপস", price: 20, image: "/assets/products/alooz.webp" },
  { id: 12, name: "চিপস", price: 20, image: "/assets/products/sun.png" },
  { id: 13, name: "চিপস", price: 20, image: "/assets/products/detos.jpg" },
  { id: 14, name: "চিপস", price: 20, image: "/assets/products/poppers.png" },
  { id: 15, name: "চিপস", price: 25, image: "/assets/products/twist.jpg" },
  { id: 16, name: "ইষ্ট ব্রেড", price: 15, image: "/assets/products/bread.jpg" },
  { id: 17, name: "পানি 500ml", price: 20, image: "/assets/products/mum.jpg" },
  { id: 18, name: "পানি 1L", price: 30, image: "/assets/products/mum1.jpg" },
  { id: 19, name: "পানি 2L", price: 40, image: "/assets/products/mum2.jpg" },
  { id: 20, name: "স্পিড 250ml", price: 25, image: "/assets/products/speed.webp" },
  { id: 21, name: "স্পিড ক্যান 250ml", price: 50, image: "/assets/products/speedc.webp" },
  { id: 22, name: "পাওয়ার 250ml", price: 25, image: "/assets/products/power.png" },
  { id: 23, name: "পাওয়ার ক্যান 250ml", price: 50, image: "/assets/products/powerc.jpg" },
  { id: 24, name: "মোজো 250ml", price: 20, image: "/assets/products/mojo.webp" },
];

export default function Calculator() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState("");

  const addProduct = (product) => {
    const exist = cart.find((item) => item.id === product.id);
    if (exist) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const increase = (id) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  };

  const decrease = (id) => {
    setCart(cart.map(item => item.id === id ? { ...item, qty: item.qty - 1 } : item).filter(item => item.qty > 0));
  };

  const remove = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.qty), 0), [cart]);
  const change = Number(paid || 0) - total;
  const productsFilter = products.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 md:p-6 text-gray-100">
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-400 mb-2">Tea Garden POS</h1>
        
        {/* Full width stacked layout with Glassmorphism */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* PRODUCT LIST */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-xl p-4 md:p-6 w-full">
            <div className="relative mb-5">
              <Search className="absolute left-3 top-3.5 text-gray-400" />
              <input
                placeholder="Search tea..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl pl-10 py-3 text-base text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {productsFilter.map(product => (
                <div
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="flex items-center gap-2 backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-2 cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 w-full group"
                >
                  <img src={product.image} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10 bg-slate-800" />
                  <div className="overflow-hidden flex-1">
                    <h3 className="font-semibold text-xs text-gray-200 group-hover:text-emerald-300 truncate">{product.name}</h3>
                    <p className="text-emerald-400 font-bold text-[11px]">৳ {product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CART */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-xl p-4 md:p-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex gap-2 text-white"><ShoppingCart /> Order</h2>
              <button onClick={() => { setCart([]); setPaid(""); }} className="p-1 hover:bg-white/10 rounded-lg transition-all">
                <RotateCcw className="text-rose-400" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No Product Added</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-2.5 flex justify-between items-center gap-3 w-full">
                    <div className="flex items-center gap-2.5">
                      <img src={item.image} className="w-9 h-9 rounded-md object-cover border border-white/10 bg-slate-800" />
                      <div>
                        <h4 className="font-semibold text-xs text-gray-200">{item.name}</h4>
                        <p className="text-[11px] text-gray-400">৳ {item.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => decrease(item.id)} className="backdrop-blur-sm bg-white/10 border border-white/10 p-1 rounded hover:bg-white/20 transition-all"><Minus size={12} /></button>
                        <span className="font-bold text-xs w-4 text-center text-gray-200">{item.qty}</span>
                        <button onClick={() => increase(item.id)} className="backdrop-blur-sm bg-emerald-600/60 border border-emerald-500/30 text-white p-1 rounded hover:bg-emerald-600 transition-all"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => remove(item.id)} className="text-rose-400 hover:text-rose-300 ml-1 p-1 hover:bg-white/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr className="my-4 border-white/10" />
            <div className="space-y-3">
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span>
                <span className="text-emerald-400">৳ {total}</span>
              </div>
              <label className="block font-medium text-gray-300">Customer Paid</label>
              <input
                type="number"
                value={paid}
                onChange={e => setPaid(e.target.value)}
                placeholder="0000"
                className="w-full backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-1">
                <p className="text-gray-300">Customer দিলো: <b className="text-white">৳ {paid || 0}</b></p>
                <p className="text-gray-300">মোট বিল: <b className="text-white">৳ {total}</b></p>
                <p className="text-emerald-400 font-bold text-lg">ফেরত পাবে: ৳ {change > 0 ? change : 0}</p>
                {change < 0 && <p className="text-rose-400 font-bold">আরো দিতে হবে: ৳ {Math.abs(change)}</p>}
              </div>
              <button className="w-full backdrop-blur-sm bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 text-white py-3 rounded-xl flex justify-center gap-2 font-bold text-lg shadow-lg transition-all">
                <Receipt /> Complete Sale
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}