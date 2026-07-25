import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, Trash, FileText, Infinity, PackageCheck, Layers, ShoppingBag } from "lucide-react";

export default function Tali() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("myTali");
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState({ title: "", quantity: "1", amount: "", type: "income" });
  const [selectedProductPrice, setSelectedProductPrice] = useState(null);
  const [editingId, setEditingId] = useState(null);

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
    localStorage.setItem("myTali", JSON.stringify(transactions));
  }, [transactions]);

  // স্টক রিভার্স বা আপডেট করার ফাংশন
  const updateStockAndSyncHome = (itemsArray, qtyChange, isIncome) => {
    if (!isIncome) return;
    const savedProducts = localStorage.getItem("myProducts");
    if (!savedProducts) return;

    try {
      let productList = JSON.parse(savedProducts);
      let updated = false;

      productList = productList.map(p => {
        const matched = itemsArray.find(i => i.name.toLowerCase() === p.name.toLowerCase());
        if (matched) {
          updated = true;
          if (p.isUnlimited) return p;

          let currentStock = parseInt(p.stock) || 0;
          let changeVal = matched.qty ? matched.qty * qtyChange : qtyChange;
          let newStock = currentStock - changeVal;
          return { ...p, stock: newStock >= 0 ? newStock : 0 };
        }
        return p;
      });

      if (updated) {
        localStorage.setItem("myProducts", JSON.stringify(productList));
        window.dispatchEvent(new Event("productStockUpdated"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addTransaction = () => {
    if (!input.title || !input.amount) return;
    
    const now = new Date();
    const isoDateOnly = now.toISOString().split("T")[0];
    const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    const qtyValue = input.quantity && input.quantity !== "" ? parseInt(input.quantity) : 1;
    const amountVal = parseFloat(input.amount);
    const isInc = input.type === "income";

    if (editingId !== null) {
      const oldTx = transactions.find(t => t.id === editingId);
      if (oldTx && oldTx.type === "income") {
        const oldItems = oldTx.isOrderGroup ? oldTx.items : [{ name: oldTx.title, qty: parseInt(oldTx.quantity || 1) }];
        updateStockAndSyncHome(oldItems, -1, true); // পুরানো স্টক ফেরত দেওয়া
      }
      
      setTransactions(transactions.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            isOrderGroup: false,
            title: input.title,
            quantity: qtyValue.toString(),
            amount: amountVal,
            type: input.type,
            dateOnly: isoDateOnly,
          };
        }
        return t;
      }));

      if (isInc) {
        updateStockAndSyncHome([{ name: input.title, qty: qtyValue }], 1, true);
      }
      setEditingId(null);
    } else {
      const newTransaction = {
        id: Date.now() + Math.random(),
        isOrderGroup: false,
        title: input.title,
        quantity: qtyValue.toString(),
        amount: amountVal,
        type: input.type,
        date: formattedDate,
        dateOnly: isoDateOnly,
      };
      setTransactions([newTransaction, ...transactions]);

      if (isInc) {
        updateStockAndSyncHome([{ name: input.title, qty: qtyValue }], 1, true);
      }
    }

    setInput({ title: "", quantity: "1", amount: "", type: "income" });
    setSelectedProductPrice(null);
  };

  const startEdit = (t) => {
    if (t.isOrderGroup) {
      alert("POS orders can be deleted and re-created if changes are needed.");
      return;
    }
    setEditingId(t.id);
    setInput({
      title: t.title,
      quantity: t.quantity || "1",
      amount: t.amount.toString(),
      type: t.type
    });
  };

  const deleteTransaction = (id) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (txToDelete && txToDelete.type === "income") {
      const itemsToRestore = txToDelete.isOrderGroup ? txToDelete.items : [{ name: txToDelete.title, qty: parseInt(txToDelete.quantity || 1) }];
      updateStockAndSyncHome(itemsToRestore, -1, true);
    }

    setTransactions(transactions.filter((t) => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setInput({ title: "", quantity: "1", amount: "", type: "income" });
      setSelectedProductPrice(null);
    }
  };

  const clearAllTransactions = () => {
    if (window.confirm("Are you sure you want to delete all entries?")) {
      transactions.forEach(t => {
        if (t.type === "income") {
          const itemsToRestore = t.isOrderGroup ? t.items : [{ name: t.title, qty: parseInt(t.quantity || 1) }];
          updateStockAndSyncHome(itemsToRestore, -1, true);
        }
      });
      setTransactions([]);
      setEditingId(null);
      setInput({ title: "", quantity: "1", amount: "", type: "income" });
      setSelectedProductPrice(null);
    }
  };

  const handleSelectItem = (name, price) => {
    setSelectedProductPrice(price);
    const qty = input.quantity && !isNaN(parseInt(input.quantity)) ? parseInt(input.quantity) : 1;
    setInput({
      title: name,
      quantity: qty.toString(),
      amount: (price * qty).toString(),
      type: "income",
    });
  };

  const handleQuantityChange = (e) => {
    const qty = e.target.value;
    let newAmount = input.amount;

    if (selectedProductPrice !== null && qty !== "") {
      const parsedQty = parseFloat(qty);
      if (!isNaN(parsedQty)) {
        newAmount = (selectedProductPrice * parsedQty).toString();
      }
    }

    setInput({
      ...input,
      quantity: qty,
      amount: newAmount,
    });
  };

  const handleTitleChange = (e) => {
    const titleVal = e.target.value;
    const allProducts = [...unlimitedProducts, ...inventoryProducts];
    const matchedItem = allProducts.find(p => p.name.toLowerCase() === titleVal.toLowerCase());

    if (matchedItem) {
      setSelectedProductPrice(matchedItem.price);
      const qty = input.quantity && !isNaN(parseFloat(input.quantity)) ? parseFloat(input.quantity) : 1;
      setInput({
        ...input,
        title: titleVal,
        amount: (matchedItem.price * qty).toString(),
      });
    } else {
      setSelectedProductPrice(null);
      setInput({
        ...input,
        title: titleVal,
      });
    }
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-[50vh] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-3 sm:p-6 w-full text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="backdrop-blur-md bg-emerald-600/30 border border-emerald-500/30 text-white p-4 sm:p-6 rounded-2xl shadow-xl">
            <p className="text-xs sm:text-sm opacity-80">Total Income</p>
            <h2 className="text-2xl sm:text-3xl font-bold">৳ {totalIncome}</h2>
          </div>
          <div className="backdrop-blur-md bg-rose-600/30 border border-rose-500/30 text-white p-4 sm:p-6 rounded-2xl shadow-xl">
            <p className="text-xs sm:text-sm opacity-80">Total Expense</p>
            <h2 className="text-2xl sm:text-3xl font-bold">৳ {totalExpense}</h2>
          </div>
          <div className="backdrop-blur-md bg-sky-600/30 border border-sky-500/30 text-white p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
            <p className="text-xs sm:text-sm opacity-80 flex items-center gap-1"><Wallet size={14} /> Remaining Balance</p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${netBalance >= 0 ? "text-sky-300" : "text-rose-300"}`}>৳ {netBalance}</h2>
          </div>
        </div>

        {/* Section 1: Unlimited Stock Items */}
        {unlimitedProducts.length > 0 && (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl mb-4">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <PackageCheck size={16} className="text-emerald-400" />
              <p className="text-[11px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider">Always Available (Unlimited Stock)</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {unlimitedProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item.name, item.price)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                  <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded-lg border border-white/10 bg-slate-800 shrink-0" />
                  <div className="overflow-hidden">
                    <span className="font-semibold text-xs text-gray-200 group-hover:text-emerald-300 block truncate flex items-center gap-1">
                      {item.name} <Infinity size={10} className="text-emerald-400 shrink-0" />
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">৳{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Inventory Items */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl mb-6">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <Layers size={16} className="text-teal-400" />
            <p className="text-[11px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider">Inventory Items (Stock Managed)</p>
          </div>
          {inventoryProducts.length === 0 ? (
            <p className="text-xs text-gray-400 px-1 py-2">No stock-managed products available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {inventoryProducts.map((p) => {
                const isOutOfStock = parseInt(p.stock) <= 0 || p.stock === "" || p.stock === null;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleSelectItem(p.name, p.price)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      isOutOfStock ? "opacity-50 bg-rose-950/20 border-rose-500/20 cursor-not-allowed" : "border-white/5 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 cursor-pointer group"
                    }`}
                  >
                    <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded-lg border border-white/10 bg-slate-800 shrink-0" />
                    <div className="overflow-hidden">
                      <span className={`font-semibold text-xs block truncate ${isOutOfStock ? "text-rose-400" : "text-gray-200 group-hover:text-emerald-300"}`}>{p.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-emerald-400 font-bold">৳{p.price}</span>
                        <span className={`text-[9px] px-1 rounded ${isOutOfStock ? "bg-rose-500/20 text-rose-300 font-bold" : "bg-white/10 text-gray-300"}`}>Stock: {p.stock || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Entry Form inside Tali */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-2xl shadow-xl mb-6">
          <h3 className="text-sm font-bold text-emerald-400 mb-2">{editingId !== null ? "Edit Entry" : "Direct Sale / Expense Entry"}</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input 
              type="text" 
              placeholder="Description / Product Name" 
              value={input.title} 
              onChange={handleTitleChange} 
              className="flex-1 backdrop-blur-sm bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500" 
            />
            <input 
              type="number" 
              placeholder="Qty" 
              value={input.quantity} 
              onChange={handleQuantityChange} 
              className="w-full sm:w-24 backdrop-blur-sm bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500" 
            />
            <input 
              type="number" 
              placeholder="Amount" 
              value={input.amount} 
              onChange={e => setInput({...input, amount: e.target.value})} 
              className="w-full sm:w-36 backdrop-blur-sm bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500" 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={input.type} 
              onChange={e => setInput({...input, type: e.target.value})} 
              className="backdrop-blur-sm bg-slate-900 border border-white/10 p-2.5 rounded-xl flex-1 text-xs sm:text-sm text-white focus:outline-none"
            >
              <option value="income">Income (Sell)</option>
              <option value="expense">Expense</option>
            </select>
            <button 
              onClick={addTransaction} 
              className="bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 text-white px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-xs sm:text-sm cursor-pointer"
            >
              <Plus size={18} /> {editingId !== null ? "Update Entry" : "Add Entry"}
            </button>
            {editingId !== null && (
              <button 
                onClick={() => { setEditingId(null); setInput({ title: "", quantity: "1", amount: "", type: "income" }); setSelectedProductPrice(null); }} 
                className="bg-rose-600/30 border border-rose-500/30 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Transactions list (POS Orders shown as grouped separate cards) */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-xs sm:text-sm text-gray-200">Separate Sales Orders History</h3>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-1 text-xs bg-sky-600/30 border border-sky-500/30 text-sky-200 px-3 py-1.5 rounded-xl font-medium"><FileText size={13} /> Print</button>
              <button onClick={clearAllTransactions} className="flex items-center gap-1 text-xs bg-rose-600/30 border border-rose-500/30 text-rose-200 px-3 py-1.5 rounded-xl font-medium"><Trash size={13} /> Clear All</button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-xs">No transactions yet</p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="p-3 border-b border-white/5 last:border-none hover:bg-white/5 transition-colors">
                {t.isOrderGroup ? (
                  // POS থেকে কমপ্লিট হওয়া অর্ডারের আলাদা কার্ড ডিজাইন
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="text-emerald-400 mt-1 shrink-0" size={22} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs sm:text-sm text-emerald-300">POS Order Sale</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full font-medium">{t.date}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {t.items.map((item, idx) => (
                            <span key={idx} className="text-[11px] bg-white/10 border border-white/5 px-2 py-0.5 rounded-lg text-gray-300">
                              {item.name} <b className="text-white">({item.qty})</b>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="font-bold text-sm sm:text-base text-emerald-400 block">+ ৳ {t.amount}</span>
                        <span className="text-[10px] text-gray-400">Total Bill</span>
                      </div>
                      <button onClick={() => deleteTransaction(t.id)} className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/10 transition-all" title="Delete Order"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ) : (
                  // সাধারণ ম্যানুয়াল ইনকাম/এক্সপেন্স রো
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {t.type === "income" ? <ArrowUpCircle className="text-emerald-400" size={20} /> : <ArrowDownCircle className="text-rose-400" size={20} />}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs sm:text-sm text-gray-200">{t.title}</p>
                          {t.quantity && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">Qty: {t.quantity}</span>}
                        </div>
                        <p className="text-[10px] text-gray-400">{t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-xs sm:text-sm ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                        {t.type === "income" ? "+" : "-"} ৳ {t.amount}
                      </span>
                      <button onClick={() => startEdit(t)} className="text-gray-400 hover:text-sky-400 p-1" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => deleteTransaction(t.id)} className="text-gray-400 hover:text-rose-400 p-1" title="Delete"><Trash2 size/></button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}