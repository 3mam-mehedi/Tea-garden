import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  RotateCcw,
  Receipt,
  Infinity,
  PackageCheck,
  Layers,
} from "lucide-react";

export default function Calculator() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("myPosCart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [paid, setPaid] = useState("");

  const [unlimitedProducts, setUnlimitedProducts] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);

  const loadProductsFromStorage = () => {
    const saved = localStorage.getItem("myProducts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const formatted = parsed.map(p => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.sell) || 0,
          image: p.image || "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300",
          isUnlimited: p.isUnlimited || false,
          stock: p.stock
        }));
        
        setUnlimitedProducts(formatted.filter(p => p.isUnlimited));
        setInventoryProducts(formatted.filter(p => !p.isUnlimited));
      } catch (e) {
        setUnlimitedProducts([]);
        setInventoryProducts([]);
      }
    } else {
      setUnlimitedProducts([]);
      setInventoryProducts([]);
    }
  };

  useEffect(() => {
    loadProductsFromStorage();
    const handleStorageChange = () => {
      loadProductsFromStorage();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("productStockUpdated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("productStockUpdated", handleStorageChange);
    };
  }, []);

  // 🔴 Error Fix: try-catch for local storage
  useEffect(() => {
    try {
      localStorage.setItem("myPosCart", JSON.stringify(cart));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        console.warn("Local storage quota exceeded. Unable to save cart state.");
        // চাইলে এখানে অ্যালার্ট দিতে পারেন: alert("স্টোরেজ লিমিট পার হয়ে গেছে!");
      }
    }
  }, [cart]);

  const addProduct = (product) => {
    if (!product.isUnlimited && (parseInt(product.stock) <= 0 || product.stock === undefined)) {
      alert(`${product.name} is out of stock!`);
      return;
    }

    const exist = cart.find((item) => item.id === product.id);
    if (exist) {
      if (!product.isUnlimited && exist.qty >= parseInt(product.stock)) {
        alert(`Cannot add more. Stock limit reached!`);
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const increase = (id) => {
    const allProducts = [...unlimitedProducts, ...inventoryProducts];
    const product = allProducts.find(p => p.id === id);
    const cartItem = cart.find(item => item.id === id);

    if (product && !product.isUnlimited && cartItem && cartItem.qty >= parseInt(product.stock)) {
      alert(`Stock limit reached!`);
      return;
    }

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

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const now = new Date();
    const isoDateOnly = now.toISOString().split("T")[0];
    const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const existingTali = localStorage.getItem("myTali");
    let taliList = existingTali ? JSON.parse(existingTali) : [];

    const newOrderTransaction = {
      id: Date.now() + Math.random(),
      isOrderGroup: true, 
      items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty })), // ইমেজ রিমুভ করা হয়েছে স্পেস বাঁচানোর জন্য
      amount: total,
      type: "income",
      date: formattedDate,
      dateOnly: isoDateOnly,
    };

    taliList.unshift(newOrderTransaction);

    // 🔴 Error Fix: Safe Storage Attempt for Tali
    try {
      localStorage.setItem("myTali", JSON.stringify(taliList));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        alert("স্টোরেজ পূর্ণ হয়ে গেছে! দয়া করে কিছু পুরোনো সেলস হিস্ট্রি ডিলিট করুন।");
        return; // স্টোরেজ ফুল থাকলে প্রসেস ক্যান্সেল করবে
      }
    }

    const savedProducts = localStorage.getItem("myProducts");
    if (savedProducts) {
      try {
        let productList = JSON.parse(savedProducts);
        productList = productList.map(p => {
          const cartMatch = cart.find(c => c.id === p.id);
          if (cartMatch && !p.isUnlimited) {
            let currentStock = parseInt(p.stock) || 0;
            let newStock = currentStock - cartMatch.qty;
            return { ...p, stock: newStock >= 0 ? newStock : 0 };
          }
          return p;
        });

        localStorage.setItem("myProducts", JSON.stringify(productList));
        window.dispatchEvent(new Event("productStockUpdated"));
      } catch (e) {
        console.error(e);
      }
    }

    setCart([]);
    setPaid("");
    localStorage.removeItem("myPosCart");
    loadProductsFromStorage();
    alert("Order completed successfully and saved as a separate sale in Tali!");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 md:p-6 text-gray-100">
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-400 mb-4">Tea Garden POS</h1>
        
        <div className="flex flex-col gap-6 w-full">
          {/* PRODUCT LIST SECTION */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-xl p-4 md:p-6 w-full">
            <div className="relative mb-5">
              <Search className="absolute left-3 top-3.5 text-gray-400" />
              <input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl pl-10 py-3 text-base text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Unlimited Products */}
            {unlimitedProducts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <PackageCheck size={16} className="text-emerald-400" />
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Always Available (Unlimited Stock)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {unlimitedProducts
                    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
                    .map(product => (
                      <div
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="flex items-center gap-2 backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-2 cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-300 w-full group"
                      >
                        <img 
                          src={product.image} 
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10 bg-slate-800" 
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"; }}
                        />
                        <div className="overflow-hidden flex-1">
                          <h3 className="font-semibold text-xs text-gray-200 group-hover:text-emerald-300 truncate flex items-center gap-1">
                            {product.name} <Infinity size={10} className="text-emerald-400 shrink-0" />
                          </h3>
                          <p className="text-emerald-400 font-bold text-[11px]">৳ {product.price}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Inventory Products */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Layers size={16} className="text-teal-400" />
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Inventory Items (Stock Managed)</p>
              </div>
              {inventoryProducts.length === 0 ? (
                <p className="text-xs text-gray-400 px-1 py-2">No stock-managed products available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {inventoryProducts
                    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
                    .map(product => {
                      const isOutOfStock = parseInt(product.stock) <= 0 || product.stock === "" || product.stock === null;
                      return (
                        <div
                          key={product.id}
                          onClick={() => !isOutOfStock && addProduct(product)}
                          className={`flex items-center gap-2 backdrop-blur-sm border rounded-xl p-2 transition-all duration-300 w-full group ${
                            isOutOfStock 
                              ? "opacity-50 bg-rose-950/20 border-rose-500/20 cursor-not-allowed" 
                              : "bg-white/5 border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 cursor-pointer"
                          }`}
                        >
                          <img 
                            src={product.image} 
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10 bg-slate-800" 
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"; }}
                          />
                          <div className="overflow-hidden flex-1">
                            <h3 className={`font-semibold text-xs truncate ${isOutOfStock ? "text-rose-400" : "text-gray-200 group-hover:text-emerald-300"}`}>
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-emerald-400 font-bold text-[11px]">৳ {product.price}</p>
                              <span className={`text-[9px] px-1 rounded ${isOutOfStock ? "bg-rose-500/20 text-rose-300 font-bold" : "bg-white/10 text-gray-300"}`}>
                                Stock: {product.stock || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* CART SECTION */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-xl p-4 md:p-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex gap-2 text-white"><ShoppingCart /> Order</h2>
              <button onClick={() => { setCart([]); localStorage.removeItem("myPosCart"); setPaid(""); }} className="p-1 hover:bg-white/10 rounded-lg transition-all" title="Reset Cart">
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
                      <img 
                        src={item.image} 
                        className="w-9 h-9 rounded-md object-cover border border-white/10 bg-slate-800" 
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"; }}
                      />
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
              <button 
                onClick={handleCompleteSale}
                className="w-full backdrop-blur-sm bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 text-white py-3 rounded-xl flex justify-center gap-2 font-bold text-lg shadow-lg transition-all cursor-pointer"
              >
                <Receipt /> Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}