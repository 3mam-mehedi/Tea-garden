import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ImagePlus, ChevronLeft, ChevronRight, AlertCircle, Infinity, PackageCheck, Layers } from "lucide-react";

export default function Products() {
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState("");
  const [editId, setEditId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "", category: "", buy: "", sell: "", stock: "", image: "", isUnlimited: false,
  });

  // localStorage থেকে ডেটা লোড করা
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("myProducts");
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "রং চা", category: "Tea", buy: 5, sell: 10, stock: 100, image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300", isUnlimited: false }
    ];
  });

  // প্রোডাক্ট আপডেট হলে localStorage-এ সেভ করা
  useEffect(() => {
    localStorage.setItem("myProducts", JSON.stringify(products));
  }, [products]);

  // অন্য কম্পোনেন্ট (Tali) থেকে স্টক আপডেটের ইভেন্ট লিসেন করা
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("myProducts");
      if (saved) {
        setProducts(JSON.parse(saved));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("productStockUpdated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("productStockUpdated", handleStorageChange);
    };
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setNewProduct({ ...newProduct, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const saveProduct = () => {
    if (!newProduct.name) return;
    if (editId) {
      setProducts(products.map(p => p.id === editId ? { ...newProduct, id: editId } : p));
    } else {
      setProducts([...products, { id: Date.now(), ...newProduct }]);
    }
    closeModal();
  };

  const deleteProduct = (id) => {
    if (window.confirm("আপনি কি নিশ্চিত এই প্রোডাক্টটি ডিলিট করতে চান?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const moveProduct = (id, direction) => {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return;
    const newProducts = [...products];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newProducts.length) {
      [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
      setProducts(newProducts);
    }
  };

  const openEditModal = (product) => {
    setEditId(product.id);
    setNewProduct({
      ...product,
      isUnlimited: product.isUnlimited || false,
    });
    setPreview(product.image);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setNewProduct({ name: "", category: "", buy: "", sell: "", stock: "", image: "", isUnlimited: false });
    setPreview("");
  };

  // প্রোডাক্টগুলোকে আলাদা করা
  const unlimitedProducts = products.filter(item => item.isUnlimited === true);
  const regularProducts = products.filter(item => item.isUnlimited !== true);

  // রেন্ডারিং কার্ড কম্পোনেন্ট হেল্পার
  const renderProductCard = (item, index) => {
    const isUnlimitedStock = item.isUnlimited === true;
    const isOutOfStock = !isUnlimitedStock && (parseInt(item.stock) <= 0 || item.stock === "" || item.stock === null);

    return (
      <div 
        key={item.id} 
        className={`p-[1px] rounded-2xl shadow-md transition-all duration-300 group flex flex-col ${
          isOutOfStock 
            ? "bg-gradient-to-br from-gray-200 via-rose-200 to-rose-300 opacity-85" 
            : "bg-gradient-to-br from-white via-emerald-200 to-emerald-400 hover:shadow-xl"
        }`}
      >
        <div className={`backdrop-blur-2xl rounded-[15px] p-2 sm:p-2.5 h-full flex flex-col justify-between ${isOutOfStock ? "bg-gray-50/80" : "bg-white/75"}`}>
          <div>
            <div className="relative mb-2 overflow-hidden rounded-xl aspect-square border border-white/80 bg-white/50 shadow-inner">
              <img 
                src={item.image || "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"} 
                className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? "grayscale opacity-60" : "group-hover:scale-105"}`} 
                alt={item.name} 
              />
              
              {/* Category Badge */}
              <span className="absolute top-1 left-1 backdrop-blur-md bg-white/80 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/60 shadow-sm truncate max-w-[65px]">
                {item.category || "General"}
              </span>

              {/* Unlimited Stock Badge */}
              {isUnlimitedStock && (
                <span className="absolute top-1 right-1 backdrop-blur-md bg-emerald-700/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/60 shadow-sm flex items-center gap-0.5">
                  <Infinity size={10} /> Always
                </span>
              )}

              {/* Out of Stock Overlay Badge */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 text-center">
                  <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm uppercase tracking-tighter flex items-center gap-0.5">
                    <AlertCircle size={10} /> Stock Out
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-xs font-bold text-gray-900 truncate mb-1" title={item.name}>{item.name}</h3>
            
            <div className="flex justify-between items-center text-[10px] text-gray-600 mb-1.5 bg-white/60 p-1 rounded-md border border-white/80 shadow-sm">
              <span>Buy: <strong className="text-gray-800">৳{item.buy}</strong></span>
              <span>
                Stock:{" "}
                {isUnlimitedStock ? (
                  <strong className="text-emerald-700 inline-flex items-center"><Infinity size={12} /></strong>
                ) : (
                  <strong className={isOutOfStock ? "text-rose-600 font-extrabold" : "text-emerald-700"}>
                    {item.stock || 0}
                  </strong>
                )}
              </span>
            </div>

            <div className={`text-[11px] font-extrabold mb-2 ${isOutOfStock ? "text-gray-500" : "text-emerald-700"}`}>
              Sell: ৳{item.sell}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-900/10">
            <div className="flex gap-0.5">
              <button onClick={() => moveProduct(item.id, -1)} className="p-1 backdrop-blur-sm bg-white/80 hover:bg-white border border-white rounded-md text-gray-600 transition-colors shadow-sm" title="Move Left">
                <ChevronLeft size={11}/>
              </button>
              <button onClick={() => moveProduct(item.id, 1)} className="p-1 backdrop-blur-sm bg-white/80 hover:bg-white border border-white rounded-md text-gray-600 transition-colors shadow-sm" title="Move Right">
                <ChevronRight size={11}/>
              </button>
            </div>

            <div className="flex gap-0.5">
              <button onClick={() => openEditModal(item)} className="p-1 backdrop-blur-sm bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 rounded-md transition-colors shadow-sm" title="Edit">
                <Pencil size={11} />
              </button>
              <button onClick={() => deleteProduct(item.id)} className="p-1 backdrop-blur-sm bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 rounded-md transition-colors shadow-sm" title="Delete">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 p-3 sm:p-6 text-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700">Products Inventory</h1>
          <button 
            onClick={() => { setEditId(null); setShowModal(true); }} 
            className="flex items-center gap-1.5 sm:gap-2 backdrop-blur-md bg-emerald-600/90 hover:bg-emerald-600 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 border border-emerald-400/40 transition-all text-xs sm:text-sm font-semibold"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Section 1: Always Available (Unlimited Stock) Items */}
        {unlimitedProducts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 px-1">
              <PackageCheck size={18} className="text-emerald-700" />
              <h2 className="text-sm sm:text-base font-bold text-emerald-900">Always Available (Unlimited Stock)</h2>
              <span className="text-xs bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">{unlimitedProducts.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {unlimitedProducts.map((item) => renderProductCard(item))}
            </div>
          </div>
        )}

        {/* Section 2: Regular Inventory Products */}
        <div>
          {unlimitedProducts.length > 0 && regularProducts.length > 0 && (
            <div className="flex items-center gap-2 mb-3 px-1 pt-2">
              <Layers size={18} className="text-teal-700" />
              <h2 className="text-sm sm:text-base font-bold text-gray-800">Inventory Products (Stock Tracked)</h2>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">{regularProducts.length}</span>
            </div>
          )}

          {regularProducts.length === 0 && unlimitedProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No products found. Please add a product.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {regularProducts.map((item) => renderProductCard(item))}
            </div>
          )}
        </div>

        {/* Modal - Mobile Optimized */}
        {showModal && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="p-[1px] rounded-[25px] bg-gradient-to-br from-white via-emerald-300 to-emerald-500 w-full max-w-md shadow-2xl shadow-emerald-950/20 my-auto">
              <div className="backdrop-blur-2xl bg-white/90 rounded-[24px] p-4 sm:p-5 text-gray-800">
                <h2 className="text-lg sm:text-xl font-bold mb-3 text-emerald-800">{editId ? "Edit Product" : "Add New Product"}</h2>
                
                <div className="flex justify-center mb-3">
                  <label className="cursor-pointer border-2 border-dashed border-emerald-400 hover:border-emerald-500 rounded-2xl w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center text-emerald-600 backdrop-blur-sm bg-white/60 transition-all shadow-inner">
                    <input type="file" hidden accept="image/*" onChange={handleImage} />
                    {preview ? <img src={preview} className="w-full h-full object-cover rounded-2xl" /> : <ImagePlus size={24} />}
                  </label>
                </div>

                <input 
                  type="text" 
                  placeholder="Name" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  className="w-full backdrop-blur-sm bg-white/80 border border-white p-2.5 rounded-xl mb-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                />
                
                <input 
                  type="text" 
                  placeholder="Category" 
                  value={newProduct.category} 
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                  className="w-full backdrop-blur-sm bg-white/80 border border-white p-2.5 rounded-xl mb-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                />
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <input 
                    type="number" 
                    placeholder="Buy" 
                    value={newProduct.buy} 
                    onChange={e => setNewProduct({...newProduct, buy: e.target.value})} 
                    className="backdrop-blur-sm bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                  />
                  <input 
                    type="number" 
                    placeholder="Sell" 
                    value={newProduct.sell} 
                    onChange={e => setNewProduct({...newProduct, sell: e.target.value})} 
                    className="backdrop-blur-sm bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                  />
                  <input 
                    type="number" 
                    placeholder="Stock" 
                    disabled={newProduct.isUnlimited}
                    value={newProduct.isUnlimited ? "" : newProduct.stock} 
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})} 
                    className={`backdrop-blur-sm bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm ${newProduct.isUnlimited ? "opacity-50 cursor-not-allowed" : ""}`} 
                  />
                </div>

                {/* Always Available (Unlimited Stock) Checkbox */}
                <div className="flex items-center gap-2 mb-4 bg-white/60 p-2.5 rounded-xl border border-white/80 shadow-sm">
                  <input 
                    type="checkbox" 
                    id="isUnlimited" 
                    checked={newProduct.isUnlimited} 
                    onChange={e => setNewProduct({...newProduct, isUnlimited: e.target.checked, stock: e.target.checked ? "" : newProduct.stock})}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isUnlimited" className="text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                    <Infinity size={14} className="text-emerald-600" /> Always Available (Unlimited Stock)
                  </label>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button onClick={closeModal} className="px-4 py-2 text-xs sm:text-sm backdrop-blur-sm bg-gray-200/80 hover:bg-gray-300 border border-white rounded-xl transition-all font-medium">Cancel</button>
                  <button onClick={saveProduct} className="px-4 py-2 text-xs sm:text-sm backdrop-blur-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all font-medium">
                    {editId ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}