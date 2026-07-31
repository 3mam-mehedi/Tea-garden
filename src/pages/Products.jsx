import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ImagePlus, ChevronLeft, ChevronRight, AlertCircle, Infinity, PackageCheck, Layers } from "lucide-react";
import { MdOutlineInventory2 } from "react-icons/md";
export default function Products() {
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState("");
  const [editId, setEditId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "", category: "", buy: "", sell: "", stock: "", image: "", isUnlimited: false,
  });

  // প্রি-ডিফাইন্ড ক্যাটাগরি লিস্ট
  const predefinedCategories = [
    "Chips", "Soft Drinks", "Tea", "Coffee", "Bread", "Juice", "Water", "Biscuit", "Chocolate", "Chewing Gum"
  ];

  // কাস্টম ক্যাটাগরি মোড হ্যান্ডেল করার জন্য স্টেট
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // localStorage থেকে ডেটা লোড করা
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("myProducts");
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "রং চা", category: "Tea", buy: 5, sell: 10, stock: 100, image: "/assets/products/rong cha.jpg", isUnlimited: false }
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
    const categoryExists = predefinedCategories.includes(product.category);
    setIsCustomCategory(!categoryExists && product.category !== "");
    
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
    setIsCustomCategory(false);
  };

  // প্রোডাক্টগুলোকে আলাদা করা
  const unlimitedProducts = products.filter(item => item.isUnlimited === true);
  const regularProducts = products.filter(item => item.isUnlimited !== true);

  // রেন্ডারিং কার্ড কম্পোনেন্ট হেল্পার (Glassmorphism & Mobile Optimized)
  const renderProductCard = (item) => {
    const isUnlimitedStock = item.isUnlimited === true;
    const isOutOfStock = !isUnlimitedStock && (parseInt(item.stock) <= 0 || item.stock === "" || item.stock === null);

    return (
      <div 
        key={item.id} 
        className={`rounded-2xl shadow-lg transition-all duration-300 group flex flex-col border ${
          isOutOfStock 
            ? "bg-rose-50/40 border-rose-200/60 opacity-85" 
            : "bg-white/40 hover:bg-white/60 border-white/60 hover:border-white hover:shadow-2xl"
        } p-2 sm:p-2.5`}
      >
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="relative mb-2 overflow-hidden rounded-xl aspect-square border border-white/50 bg-white/30 shadow-inner">
              <img 
                src={item.image || "/assets/products/rong cha.jpg"} 
                className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? "grayscale opacity-60" : "group-hover:scale-105"}`} 
                alt={item.name} 
              />
              
              {/* Category Badge */}
              <span className="absolute top-1 left-1 bg-white/70 text-emerald-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/40 shadow-sm truncate max-w-[65px]">
                {item.category || "General"}
              </span>

              {/* Unlimited Stock Badge */}
              {isUnlimitedStock && (
                <span className="absolute top-1 right-1 bg-emerald-700/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/40 shadow-sm flex items-center gap-0.5">
                  <Infinity size={15} /> Always
                </span>
              )}

              {/* Out of Stock Overlay Badge */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-rose-950/30 flex flex-col items-center justify-center p-1 text-center">
                  <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm uppercase tracking-tighter flex items-center gap-0.5">
                    <AlertCircle size={10} /> Stock Out
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-xs font-bold text-gray-900 truncate mb-1" title={item.name}>{item.name}</h3>
            
            <div className="flex justify-between items-center text-[10px] text-gray-600 mb-1.5 bg-white/40 p-1 rounded-md border border-white/50 shadow-sm">
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
              <button onClick={() => moveProduct(item.id, -1)} className="p-1  bg-white/60 hover:bg-white/90 border border-white/60 rounded-md text-gray-600 transition-colors shadow-sm" title="Move Left">
                <ChevronLeft size={11}/>
              </button>
              <button onClick={() => moveProduct(item.id, 1)} className="p-1  bg-white/60 hover:bg-white/90 border border-white/60 rounded-md text-gray-600 transition-colors shadow-sm" title="Move Right">
                <ChevronRight size={11}/>
              </button>
            </div>

            <div className="flex gap-0.5">
              <button onClick={() => openEditModal(item)} className="p-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-800 rounded-md transition-colors shadow-sm" title="Edit">
                <Pencil size={11} />
              </button>
              <button onClick={() => deleteProduct(item.id)} className="p-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-800 rounded-md transition-colors shadow-sm" title="Delete">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 text-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0b5d2a]">Products Inventory</h1>
          
          {/* Glassmorphism Add Product Button */}
          <button 
            onClick={() => { setEditId(null); setShowModal(true); }} 
            className="flex-1 sm:flex-none bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-900 px-6 sm:px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 text-xs sm:text-sm cursor-pointer transition-all"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Section 1: Always Available (Unlimited Stock) Items */}
        {unlimitedProducts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 px-1">
              <PackageCheck size={20} className="text-emerald-700" />
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
              <MdOutlineInventory2 size={20} className="text-teal-700" />
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
          <div className="fixed inset-0 bg-emerald-950/40  flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="p-[1px] rounded-[25px] bg-gradient-to-br from-white via-emerald-300 to-emerald-500 w-full max-w-md shadow-2xl shadow-emerald-950/20 my-auto">
              <div className=" bg-white/90 rounded-[24px] p-4 sm:p-5 text-gray-800">
                <h2 className="text-lg sm:text-xl font-bold mb-3 text-emerald-800">{editId ? "Edit Product" : "Add New Product"}</h2>
                
                <div className="flex justify-center mb-3">
                  <label className="cursor-pointer border-2 border-dashed border-emerald-400 hover:border-emerald-500 rounded-2xl w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center text-emerald-600  bg-white/60 transition-all shadow-inner">
                    <input type="file" hidden accept="image/*" onChange={handleImage} />
                    {preview ? <img src={preview} className="w-full h-full object-cover rounded-2xl" /> : <ImagePlus size={24} />}
                  </label>
                </div>

                <input 
                  type="text" 
                  placeholder="Name" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  className="w-full bg-white/80 border border-white p-2.5 rounded-xl mb-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                />
                
                {/* Category Selection with Custom Input Option */}
                <div className="mb-2.5">
                  {isCustomCategory ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type Custom Category" 
                        value={newProduct.category} 
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                        className="w-full bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                      />
                      <button 
                        type="button" 
                        onClick={() => { setIsCustomCategory(false); setNewProduct({...newProduct, category: ""}); }} 
                        className="px-3 bg-gray-200 hover:bg-gray-300 text-xs rounded-xl font-medium text-gray-700 transition-colors"
                      >
                        List
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select 
                        value={newProduct.category} 
                        onChange={e => {
                          if (e.target.value === "custom_add_new") {
                            setIsCustomCategory(true);
                            setNewProduct({...newProduct, category: ""});
                          } else {
                            setNewProduct({...newProduct, category: e.target.value});
                          }
                        }}
                        className="w-full bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                      >
                        <option value="">Select Category</option>
                        {predefinedCategories.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                        <option value="custom_add_new" className="font-bold text-emerald-700">+ Custom Category...</option>
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <input 
                    type="number" 
                    placeholder="Buy" 
                    value={newProduct.buy} 
                    onChange={e => setNewProduct({...newProduct, buy: e.target.value})} 
                    className="bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                  />
                  <input 
                    type="number" 
                    placeholder="Sell" 
                    value={newProduct.sell} 
                    onChange={e => setNewProduct({...newProduct, sell: e.target.value})} 
                    className=" bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
                  />
                  <input 
                    type="number" 
                    placeholder="Stock" 
                    disabled={newProduct.isUnlimited}
                    value={newProduct.isUnlimited ? "" : newProduct.stock} 
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})} 
                    className={`bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm ${newProduct.isUnlimited ? "opacity-50 cursor-not-allowed" : ""}`} 
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
                  <button onClick={closeModal} className="px-4 py-2 text-xs sm:text-sm  bg-gray-200/80 hover:bg-gray-300 border border-white rounded-xl transition-all font-medium">Cancel</button>
                  <button onClick={saveProduct} className="px-4 py-2 text-xs sm:text-sm  bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all font-medium">
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