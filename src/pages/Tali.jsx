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
          image: p.image || "/assets/products/rong cha.jpg",
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
        updateStockAndSyncHome(oldItems, -1, true);
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
    <div className="min-h-[50vh] p-2 sm:p-6 w-full text-gray-800 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className=" bg-emerald-500/15 border border-emerald-500/30 text-gray-800 p-3 sm:p-6 rounded-2xl shadow-xl">
            <p className="text-xs sm:text-sm text-emerald-900 font-medium">Total Income</p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-emerald-700">৳ {totalIncome}</h2>
          </div>
          <div className=" bg-rose-500/15 border border-rose-500/30 text-gray-800 p-3 sm:p-6 rounded-2xl shadow-xl">
            <p className="text-xs sm:text-sm text-rose-900 font-medium">Total Expense</p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-rose-700">৳ {totalExpense}</h2>
          </div>
          <div className=" bg-sky-500/15 border border-sky-500/30 text-gray-800 p-3 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-center">
            <p className="text-xs sm:text-sm text-sky-900 font-medium flex items-center gap-1"><Wallet size={14} /> Remaining Balance</p>
            <h2 className={`text-xl sm:text-3xl font-extrabold ${netBalance >= 0 ? "text-sky-700" : "text-rose-700"}`}>৳ {netBalance}</h2>
          </div>
        </div>

        {/* Section 1: Unlimited Stock Items */}
        {unlimitedProducts.length > 0 && (
          <div className=" bg-white/75 border border-white/80 p-3 sm:p-4 rounded-2xl shadow-xl mb-4">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <PackageCheck size={16} className="text-emerald-700" />
              <p className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">Always Available (Unlimited Stock)</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {unlimitedProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item.name, item.price)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-white/80 bg-white/60 hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm"
                >
                  <img src={item.image} alt={item.name} className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-lg border border-white/60 bg-gray-100 shrink-0" />
                  <div className="overflow-hidden min-w-0">
                    <span className="font-semibold text-[11px] sm:text-xs text-gray-800 group-hover:text-emerald-800 block truncate flex items-center gap-1">
                      {item.name} <Infinity size={10} className="text-emerald-700 shrink-0" />
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">৳{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Inventory Items */}
        <div className=" bg-white/75 border border-white/80 p-3 sm:p-4 rounded-2xl shadow-xl mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <Layers size={16} className="text-teal-700" />
            <p className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Inventory Items (Stock Managed)</p>
          </div>
          {inventoryProducts.length === 0 ? (
            <p className="text-xs text-gray-500 px-1 py-2">No stock-managed products available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {inventoryProducts.map((p) => {
                const isOutOfStock = parseInt(p.stock) <= 0 || p.stock === "" || p.stock === null;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleSelectItem(p.name, p.price)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all shadow-sm ${
                      isOutOfStock ? "opacity-60 bg-rose-50/80 border-rose-200 cursor-not-allowed" : "border-white/80 bg-white/60 hover:bg-emerald-500/15 hover:border-emerald-500/30 cursor-pointer group"
                    }`}
                  >
                    <img src={p.image} alt={p.name} className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-lg border border-white/60 bg-gray-100 shrink-0" />
                    <div className="overflow-hidden min-w-0">
                      <span className={`font-semibold text-[11px] sm:text-xs block truncate ${isOutOfStock ? "text-rose-700 font-bold" : "text-gray-800 group-hover:text-emerald-800"}`}>{p.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-emerald-700 font-bold">৳{p.price}</span>
                        <span className={`text-[9px] px-1 rounded ${isOutOfStock ? "bg-rose-100 text-rose-700 font-bold" : "bg-gray-100 text-gray-600"}`}>Stock: {p.stock || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Entry Form inside Tali */}
        <div className=" bg-white/75 border border-white/80 p-3 sm:p-4 rounded-2xl shadow-xl mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-bold text-emerald-700 mb-2">{editingId !== null ? "Edit Entry" : "Direct Sale / Expense Entry"}</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input 
              type="text" 
              placeholder="Description / Product Name" 
              value={input.title} 
              onChange={handleTitleChange} 
              className="flex-1 bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
            />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
              <input 
                type="number" 
                placeholder="Qty" 
                value={input.quantity} 
                onChange={handleQuantityChange} 
                className="w-full sm:w-20  bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
              />
              <input 
                type="number" 
                placeholder="Amount" 
                value={input.amount} 
                onChange={e => setInput({...input, amount: e.target.value})} 
                className="w-full sm:w-32  bg-white/80 border border-white p-2.5 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-sm" 
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select 
              value={input.type} 
              onChange={e => setInput({...input, type: e.target.value})} 
              className=" bg-white/80 border border-white p-2.5 rounded-xl flex-1 text-xs sm:text-sm text-gray-800 focus:outline-none shadow-sm"
            >
              <option value="income">Income (Sell)</option>
              <option value="expense">Expense</option>
            </select>
            <div className="flex gap-2">
              <button 
                onClick={addTransaction} 
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/30 text-white px-6 sm:px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-xs sm:text-sm cursor-pointer transition-all"
              >
                <Plus size={16} /> {editingId !== null ? "Update" : "Add Entry"}
              </button>
              {editingId !== null && (
                <button 
                  onClick={() => { setEditingId(null); setInput({ title: "", quantity: "1", amount: "", type: "income" }); setSelectedProductPrice(null); }} 
                  className="bg-gray-200 hover:bg-gray-300 border border-white text-gray-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transactions list (POS Orders shown as grouped separate cards) */}
        <div className=" bg-white/75 border border-white/80 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-white/60">
            <h3 className="font-bold text-xs sm:text-sm text-gray-800">Separate Sales Orders History</h3>
            <div className="flex gap-1.5 sm:gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-1 text-[11px] sm:text-xs bg-sky-500/15 border border-sky-500/30 text-sky-700 px-2.5 py-1.5 rounded-xl font-semibold shadow-sm"><FileText size={13} /> Print</button>
              <button onClick={clearAllTransactions} className="flex items-center gap-1 text-[11px] sm:text-xs bg-rose-500/15 border border-rose-500/30 text-rose-700 px-2.5 py-1.5 rounded-xl font-semibold shadow-sm"><Trash size={13} /> Clear</button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-xs">No transactions yet</p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="p-3 border-b border-gray-100 last:border-none hover:bg-white/50 transition-colors">
                {t.isOrderGroup ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      <ShoppingBag className="text-emerald-700 mt-0.5 sm:mt-1 shrink-0" size={20} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-bold text-xs sm:text-sm text-emerald-800">POS Order Sale</span>
                          <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">{t.date}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.items.map((item, idx) => (
                            <span key={idx} className="text-[10px] sm:text-[11px] bg-white/80 border border-white px-2 py-0.5 rounded-lg text-gray-700 shadow-sm">
                              {item.name} <b className="text-gray-900">({item.qty})</b>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="text-left sm:text-right">
                        <span className="font-bold text-xs sm:text-base text-emerald-700 block">+ ৳ {t.amount}</span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500">Total Bill</span>
                      </div>
                      <button onClick={() => deleteTransaction(t.id)} className="text-gray-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all shrink-0" title="Delete Order"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {t.type === "income" ? <ArrowUpCircle className="text-emerald-600 shrink-0" size={18} /> : <ArrowDownCircle className="text-rose-600 shrink-0" size={18} />}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-bold text-xs sm:text-sm text-gray-800 truncate">{t.title}</p>
                          {t.quantity && <span className="text-[9px] sm:text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">Qty: {t.quantity}</span>}
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{t.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className={`font-bold text-xs sm:text-sm ${t.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                        {t.type === "income" ? "+" : "-"} ৳ {t.amount}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(t)} className="text-gray-500 hover:text-sky-600 p-1" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => deleteTransaction(t.id)} className="text-gray-500 hover:text-rose-600 p-1" title="Delete"><Trash2 size={14} /></button>
                      </div>
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