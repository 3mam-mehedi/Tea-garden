import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, Trash, FileText } from "lucide-react";

// কাস্টম কুইক আইটেমগুলোর স্ট্যাটিক বা ডিফল্ট JSON ডেটা
const initialCustomQuickItems = [
  { id: 1, name: "রং চা", price: 10, image: "/assets/products/rong.png" },
  { id: 2, name: "লেবু চা", price: 10, image: "/assets/products/lebu.png" },
  { id: 3, name: "দুধ চা", price: 20, image: "/assets/products/milk.jpg" },
  { id: 4, name: "স্পেশাল দুধ চা", price: 30, image: "/assets/products/special.jpg" },
  { id: 5, name: "মালাই চা", price: 50, image: "/assets/products/malai.jpg" },
  { id: 6, name: "কফি(হাফ)", price: 30, image: "/assets/products/coffee.jpg" },
  { id: 7, name: "কফি(ফুল)", price: 50, image: "/assets/products/coffe.jpg" },
  { id: 8, name: "পোড়ারুটি", price: 30, image: "/assets/products/ruti.png" },
];

export default function Tali() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("myTali");
    return saved ? JSON.parse(saved) : [];
  });

  const [customQuickItems] = useState(initialCustomQuickItems);
  const [input, setInput] = useState({ title: "", quantity: "1", amount: "", type: "income" });
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [selectedProductPrice, setSelectedProductPrice] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // ইনভেন্টরি প্রোডাক্ট লিস্ট লোড করা
  const inventoryProducts = (() => {
    const saved = localStorage.getItem("myProducts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(p => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.sell) || 0,
          image: p.image || "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  })();

  useEffect(() => {
    localStorage.setItem("myTali", JSON.stringify(transactions));
  }, [transactions]);

  // স্টক আপডেট করার ফাংশন
  const updateStockOnSale = (productName, qtyChange, isIncome) => {
    if (!isIncome) return;
    const savedProducts = localStorage.getItem("myProducts");
    if (!savedProducts) return;

    try {
      let productList = JSON.parse(savedProducts);
      let updated = false;

      productList = productList.map(p => {
        if (p.name.toLowerCase() === productName.toLowerCase()) {
          updated = true;
          let currentStock = parseInt(p.stock) || 0;
          let newStock = currentStock - qtyChange;
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
    const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    const qtyValue = input.quantity && input.quantity !== "" ? parseInt(input.quantity) : 1;
    const amountVal = parseFloat(input.amount);
    const isInc = input.type === "income";

    if (editingId !== null) {
      const oldTx = transactions.find(t => t.id === editingId);
      if (oldTx && oldTx.type === "income") {
        updateStockOnSale(oldTx.title, -parseInt(oldTx.quantity || 1), true);
      }
      
      setTransactions(transactions.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            title: input.title,
            quantity: qtyValue.toString(),
            amount: amountVal,
            type: input.type,
          };
        }
        return t;
      }));

      if (isInc) {
        updateStockOnSale(input.title, qtyValue, true);
      }
      setEditingId(null);
    } else {
      const newTransaction = {
        id: Date.now(),
        title: input.title,
        quantity: qtyValue.toString(),
        amount: amountVal,
        type: input.type,
        date: formattedDate,
      };
      setTransactions([newTransaction, ...transactions]);

      if (isInc) {
        updateStockOnSale(input.title, qtyValue, true);
      }
    }

    setInput({ title: "", quantity: "1", amount: "", type: "income" });
    setSelectedProductPrice(null);
  };

  const deleteTransaction = (id) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (txToDelete && txToDelete.type === "income") {
      updateStockOnSale(txToDelete.title, -parseInt(txToDelete.quantity || 1), true);
    }

    setTransactions(transactions.filter((t) => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setInput({ title: "", quantity: "1", amount: "", type: "income" });
      setSelectedProductPrice(null);
    }
  };

  // সব ট্রানজেকশন একবারে ডিলিট করার ফাংশন
  const clearAllTransactions = () => {
    if (window.confirm("Are you sure you want to delete all transactions?")) {
      transactions.forEach(t => {
        if (t.type === "income") {
          updateStockOnSale(t.title, -parseInt(t.quantity || 1), true);
        }
      });
      setTransactions([]);
      setEditingId(null);
      setInput({ title: "", quantity: "1", amount: "", type: "income" });
      setSelectedProductPrice(null);
    }
  };

  // PDF বা প্রিন্ট রিপোর্ট জেনারেট করার ফাংশন
  const downloadPDFReport = () => {
    const printWindow = window.open('', '_blank');
    const totalInc = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    
    const htmlContent = `
      <html>
        <head>
          <title>Tali Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; color: #047857; }
            .summary { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #047857; color: white; }
            .income { color: #047857; font-weight: bold; }
            .expense { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Transaction & Sales Report</h2>
          <div class="summary">
            <p><strong>Total Income:</strong> ৳ ${totalInc}</p>
            <p><strong>Total Expense:</strong> ৳ ${totalExp}</p>
            <p><strong>Net Balance:</strong> ৳ ${totalInc - totalExp}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${t.date}</td>
                  <td>${t.title}</td>
                  <td class="${t.type}">${t.type.toUpperCase()}</td>
                  <td>${t.quantity || 1}</td>
                  <td>৳ ${t.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    const matchedInv = inventoryProducts.find(p => p.name.toLowerCase() === t.title.toLowerCase());
    const matchedCustom = customQuickItems.find(c => c.name.toLowerCase() === t.title.toLowerCase());
    const unitPrice = matchedInv ? matchedInv.price : (matchedCustom ? matchedCustom.price : (parseFloat(t.amount) / parseFloat(t.quantity || 1)));

    setSelectedProductPrice(unitPrice);
    setInput({
      title: t.title,
      quantity: t.quantity || "1",
      amount: t.amount.toString(),
      type: t.type,
    });
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
    const matchedInv = inventoryProducts.find(p => p.name.toLowerCase() === titleVal.toLowerCase());
    const matchedCustom = customQuickItems.find(c => c.name.toLowerCase() === titleVal.toLowerCase());
    const matchedItem = matchedInv || matchedCustom;

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

  // ইনকাম ব্রেকডাউন তৈরি (প্রতিটি আইটেমের নাম, মোট কুয়ান্টিটি এবং মোট অ্যামাউন্ট সহ)
  const getIncomeDetailedBreakdown = () => {
    const filtered = transactions.filter(t => t.type === "income");
    const grouped = filtered.reduce((acc, t) => {
      if (!acc[t.title]) {
        acc[t.title] = { totalQty: 0, totalAmount: 0 };
      }
      acc[t.title].totalQty += parseInt(t.quantity || 1);
      acc[t.title].totalAmount += t.amount;
      return acc;
    }, {});
    return Object.entries(grouped);
  };

  const getExpenseBreakdown = () => {
    const filtered = transactions.filter(t => t.type === "expense");
    const grouped = filtered.reduce((acc, t) => {
      acc[t.title] = (acc[t.title] || 0) + t.amount;
      return acc;
    }, {});
    return Object.entries(grouped);
  };

  const incomeBreakdown = getIncomeDetailedBreakdown();
  const expenseBreakdown = getExpenseBreakdown();

  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-[50vh] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 w-full text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <div 
              onClick={() => setActiveTooltip(activeTooltip === 'income' ? null : 'income')}
              className="backdrop-blur-md bg-emerald-600/30 border border-emerald-500/30 text-white p-6 rounded-3xl shadow-xl cursor-pointer select-none hover:bg-emerald-600/40 transition-all"
            >
              <p className="text-sm opacity-80">Total Income (Click for details with Qty)</p>
              <h2 className="text-3xl font-bold">৳ {totalIncome}</h2>
            </div>
            {activeTooltip === 'income' && (
              <div className="absolute left-0 right-0 mt-2 backdrop-blur-xl bg-slate-900/90 border border-emerald-500/30 text-gray-100 p-4 rounded-3xl shadow-2xl z-20">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 border-b border-emerald-500/20 pb-1">Income Breakdown (Qty & Amount)</p>
                {incomeBreakdown.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No income recorded yet</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {incomeBreakdown.map(([title, data], idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-300">{title} <span className="text-xs text-emerald-300 bg-emerald-900/40 px-1.5 py-0.5 rounded">x{data.totalQty}</span></span>
                        <span className="font-bold text-emerald-400">৳ {data.totalAmount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <div 
              onClick={() => setActiveTooltip(activeTooltip === 'expense' ? null : 'expense')}
              className="backdrop-blur-md bg-rose-600/30 border border-rose-500/30 text-white p-6 rounded-3xl shadow-xl cursor-pointer select-none hover:bg-rose-600/40 transition-all"
            >
              <p className="text-sm opacity-80">Total Expense (Click for details)</p>
              <h2 className="text-3xl font-bold">৳ {totalExpense}</h2>
            </div>
            {activeTooltip === 'expense' && (
              <div className="absolute left-0 right-0 mt-2 backdrop-blur-xl bg-slate-900/90 border border-rose-500/30 text-gray-100 p-4 rounded-3xl shadow-2xl z-20">
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 border-b border-rose-500/20 pb-1">Expense Breakdown</p>
                {expenseBreakdown.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No expense recorded yet</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {expenseBreakdown.map(([title, amount], idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-300">{title}</span>
                        <span className="font-bold text-rose-400">৳ {amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="backdrop-blur-md bg-sky-600/30 border border-sky-500/30 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-center">
            <p className="text-sm opacity-80 flex items-center gap-1">
              <Wallet size={16} /> Remaining Balance
            </p>
            <h2 className={`text-3xl font-bold ${netBalance >= 0 ? "text-sky-300" : "text-rose-300"}`}>
              ৳ {netBalance}
            </h2>
          </div>
        </div>

        {/* Custom Quick Items Section */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-3xl shadow-xl mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Custom Quick Items (JSON Based & No Stock Required)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {customQuickItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item.name, item.price)}
                className="flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-pointer group"
              >
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-10 h-10 object-cover rounded-xl border border-white/10 bg-slate-800 shrink-0"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"; }}
                />
                <div className="overflow-hidden">
                  <span className="font-semibold text-xs text-gray-200 group-hover:text-emerald-300 block truncate">{item.name}</span>
                  <span className="text-[11px] text-emerald-400 font-bold">৳{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Items Section */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-3xl shadow-xl mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Inventory Items (Stock Managed)</p>
          {inventoryProducts.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-3">No products available in inventory.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1">
              {inventoryProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectItem(p.name, p.price)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-10 h-10 object-cover rounded-xl border border-white/10 bg-slate-800 shrink-0"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"; }}
                  />
                  <div className="overflow-hidden">
                    <span className="font-semibold text-xs text-gray-200 group-hover:text-emerald-300 block truncate">{p.name}</span>
                    <span className="text-[11px] text-emerald-400 font-bold">৳{p.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-3xl shadow-xl mb-8">
          {editingId !== null && (
            <div className="mb-3 flex justify-between items-center bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-300 text-xs font-medium">
              <span>Editing transaction...</span>
              <button 
                onClick={() => {
                  setEditingId(null);
                  setInput({ title: "", quantity: "1", amount: "", type: "income" });
                  setSelectedProductPrice(null);
                }}
                className="underline hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Description / Custom Item / Inventory Product Name" 
              value={input.title} 
              onChange={handleTitleChange} 
              className="flex-1 backdrop-blur-sm bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500" 
            />
            <input 
              type="number" 
              placeholder="Qty" 
              value={input.quantity} 
              onChange={handleQuantityChange} 
              className="w-full sm:w-24 backdrop-blur-sm bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500" 
            />
            <input 
              type="number" 
              placeholder="Amount" 
              value={input.amount} 
              onChange={e => {
                const newAmt = e.target.value;
                setInput({...input, amount: newAmt});
                if (newAmt !== "" && input.quantity && parseFloat(input.quantity) > 0) {
                  setSelectedProductPrice(parseFloat(newAmt) / parseFloat(input.quantity));
                } else {
                  setSelectedProductPrice(null);
                }
              }} 
              className="w-full sm:w-36 backdrop-blur-sm bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500" 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={input.type} 
              onChange={e => setInput({...input, type: e.target.value})} 
              className="backdrop-blur-sm bg-slate-900 border border-white/10 p-3 rounded-xl flex-1 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="income" className="bg-slate-900">Income (Sell)</option>
              <option value="expense" className="bg-slate-900">Expense</option>
            </select>
            <button 
              onClick={addTransaction} 
              className={`backdrop-blur-sm border transition-all text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg ${
                editingId !== null 
                  ? "bg-amber-600/80 hover:bg-amber-600 border-amber-500/30" 
                  : "bg-emerald-600/80 hover:bg-emerald-600 border-emerald-500/30"
              }`}
            >
              <Plus size={20} /> {editingId !== null ? "Update" : "Add"}
            </button>
          </div>
        </div>

        {/* Transaction List Section with Action Buttons (Clear All & Download PDF) */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-sm text-gray-200">Transaction History</h3>
            <div className="flex gap-2">
              <button 
                onClick={downloadPDFReport}
                className="flex items-center gap-1.5 text-xs bg-sky-600/30 border border-sky-500/30 hover:bg-sky-600/50 text-sky-200 px-3 py-1.5 rounded-xl font-medium transition-all"
              >
                <FileText size={14} /> Download PDF
              </button>
              <button 
                onClick={clearAllTransactions}
                className="flex items-center gap-1.5 text-xs bg-rose-600/30 border border-rose-500/30 hover:bg-rose-600/50 text-rose-200 px-3 py-1.5 rounded-xl font-medium transition-all"
              >
                <Trash size={14} /> Clear All
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">No transactions yet</p>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-none hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  {t.type === "income" ? <ArrowUpCircle className="text-emerald-400" /> : <ArrowDownCircle className="text-rose-400" />}
                  <div>
                    <p className="font-bold text-gray-200">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  {t.quantity && (
                    <span className="text-xs bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-emerald-300 font-medium">
                      Qty: {t.quantity}
                    </span>
                  )}
                  <span className={`font-bold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.type === "income" ? "+" : "-"} ৳ {t.amount}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(t)} className="text-gray-400 hover:text-amber-400 transition-colors" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteTransaction(t.id)} className="text-gray-400 hover:text-rose-400 transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}