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
import { MdOutlineInventory2,MdPointOfSale } from "react-icons/md";
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

  useEffect(() => {
    try {
      localStorage.setItem("myPosCart", JSON.stringify(cart));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        console.warn("Local storage quota exceeded. Unable to save cart state.");
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
      items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty })), 
      amount: total,
      type: "income",
      date: formattedDate,
      dateOnly: isoDateOnly,
    };

    taliList.unshift(newOrderTransaction);

    try {
      localStorage.setItem("myTali", JSON.stringify(taliList));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        alert("স্টোরেজ পূর্ণ হয়ে গেছে! দয়া করে কিছু পুরোনো সেলস হিস্ট্রি ডিলিট করুন।");
        return; 
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
    <div className="w-full min-h-screen p-2 sm:p-6 text-gray-800 max-w-full overflow-x-hidden">
      <div className="max-w-full mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0b5d2a] mb-3 sm:mb-4 px-1">Tea Garden POS</h1>
        
        <div className="flex flex-col gap-4 sm:gap-6 w-full">
          {/* PRODUCT LIST SECTION */}
          <div className=" bg-white/75 border border-white/80 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-6 w-full">
            <div className="relative mb-3 sm:mb-5">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/80 border border-white rounded-xl pl-9 pr-3 py-2.5 sm:py-3 text-xs sm:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            {/* Unlimited Products */}
            {unlimitedProducts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <PackageCheck size={20} className="text-emerald-700" />
                  <p className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">Always Available (Unlimited Stock)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {unlimitedProducts
                    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
                    .map(product => (
                      <div
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="flex items-center gap-2 backdrop-blur-sm bg-white/60 border border-white/80 rounded-xl p-2 cursor-pointer hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all duration-300 w-full group shadow-sm min-w-0"
                      >
                        <img 
                          src={product.image} 
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 border border-white/60 bg-gray-100" 
                          onError={(e) => { e.target.src = "/assets/products/rong cha.jpg"; }}
                        />
                        <div className="overflow-hidden flex-1 min-w-0">
                          <h3 className="font-semibold text-[11px] sm:text-xs text-gray-800 group-hover:text-emerald-800 truncate flex items-center gap-1">
                            {product.name} <Infinity size={15} className="text-emerald-700 shrink-0" />
                          </h3>
                          <p className="text-emerald-700 font-bold text-[10px] sm:text-[11px]">৳ {product.price}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Inventory Products */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <MdOutlineInventory2 size={20} className="text-teal-700" />
                <p className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Inventory Items (Stock Managed)</p>
              </div>
              {inventoryProducts.length === 0 ? (
                <p className="text-xs text-gray-500 px-1 py-2">No stock-managed products available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {inventoryProducts
                    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
                    .map(product => {
                      const isOutOfStock = parseInt(product.stock) <= 0 || product.stock === "" || product.stock === null;
                      return (
                        <div
                          key={product.id}
                          onClick={() => !isOutOfStock && addProduct(product)}
                          className={`flex items-center gap-2 backdrop-blur-sm border rounded-xl p-2 transition-all duration-300 w-full group shadow-sm min-w-0 ${
                            isOutOfStock 
                              ? "opacity-60 bg-rose-50/80 border-rose-200 cursor-not-allowed" 
                              : "bg-white/60 border-white/80 hover:bg-emerald-500/15 hover:border-emerald-500/30 cursor-pointer"
                          }`}
                        >
                          <img 
                            src={product.image} 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 border border-white/60 bg-gray-100" 
                            onError={(e) => { e.target.src = "/assets/products/rong cha.jpg"; }}
                          />
                          <div className="overflow-hidden flex-1 min-w-0">
                            <h3 className={`font-semibold text-[11px] sm:text-xs truncate ${isOutOfStock ? "text-rose-700 font-bold" : "text-gray-800 group-hover:text-emerald-800"}`}>
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-emerald-700 font-bold text-[10px] sm:text-[11px]">৳ {product.price}</p>
                              <span className={`text-[9px] px-1 rounded truncate ${isOutOfStock ? "bg-rose-100 text-rose-700 font-bold" : "bg-gray-100 text-gray-600"}`}>
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
          <div className=" bg-white/75 border border-white/80 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold flex gap-2 text-gray-800 items-center"><ShoppingCart className="text-emerald-700" size={20} /> Order</h2>
              <button onClick={() => { setCart([]); localStorage.removeItem("myPosCart"); setPaid(""); }} className="p-1.5 hover:bg-rose-50 rounded-lg transition-all" title="Reset Cart">
                <RotateCcw className="text-rose-600" size={16} />
              </button>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2 max-h-[350px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-xs">No Product Added</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className=" bg-white/60 border border-white/80 rounded-xl p-2 sm:p-2.5 flex justify-between items-center gap-2 w-full shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={item.image} 
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover border border-white/60 bg-gray-100 shrink-0" 
                        onError={(e) => { e.target.src = "/assets/products/rong cha.jpg"; }}
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-[11px] sm:text-xs text-gray-800 truncate">{item.name}</h4>
                        <p className="text-[10px] sm:text-[11px] text-gray-500">৳ {item.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <button onClick={() => decrease(item.id)} className=" bg-gray-100 border border-gray-200 p-1 rounded hover:bg-gray-200 transition-all text-gray-700"><Minus size={10} /></button>
                        <span className="font-bold text-xs w-4 text-center text-gray-800">{item.qty}</span>
                        <button onClick={() => increase(item.id)} className=" bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/30 text-white p-1 rounded transition-all"><Plus size={10} /></button>
                      </div>
                      <button onClick={() => remove(item.id)} className="text-gray-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr className="my-3 sm:my-4 border-gray-200" />
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-800">
                <span>Total</span>
                <span className="text-emerald-700">৳ {total}</span>
              </div>
              <label className="block font-medium text-xs sm:text-sm text-gray-700">Customer Paid</label>
              <input
                type="number"
                value={paid}
                onChange={e => setPaid(e.target.value)}
                placeholder="0000"
                className="w-full  bg-white/80 border border-white rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
              <div className=" bg-white/60 border border-white/80 rounded-xl p-3 sm:p-4 text-xs sm:text-sm space-y-1 shadow-sm">
                <p className="text-gray-700">Customer দিলো: <b className="text-gray-900">৳ {paid || 0}</b></p>
                <p className="text-gray-700">মোট বিল: <b className="text-gray-900">৳ {total}</b></p>
                <p className="text-emerald-700 font-bold text-base sm:text-lg">ফেরত পাবে: ৳ {change > 0 ? change : 0}</p>
                {change < 0 && <p className="text-rose-600 font-bold text-xs sm:text-sm">আরো দিতে হবে: ৳ {Math.abs(change)}</p>}
              </div>
              <button 
                onClick={handleCompleteSale}
                className="w-full  bg-emerald-500/25 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 py-2.5 sm:py-3 rounded-xl flex justify-center items-center gap-2 font-bold text-base sm:text-lg shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <MdPointOfSale size={18} /> Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}