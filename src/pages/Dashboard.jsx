import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, TrendingUp, ArrowLeft, FileText } from "lucide-react";

export default function Dashboard({ onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCard, setSelectedCard] = useState("sales");

  const loadData = () => {
    const savedTali = localStorage.getItem("myTali");
    if (savedTali) {
      try {
        setTransactions(JSON.parse(savedTali));
      } catch (e) {
        setTransactions([]);
      }
    }

    const savedProducts = localStorage.getItem("myProducts");
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        setProducts([]);
      }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    window.addEventListener("productStockUpdated", loadData);

    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("productStockUpdated", loadData);
    };
  }, []);

  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());

  const todaysTransactionsRaw = transactions.filter(
    (t) => t && t.type === "income" && ((t.dateOnly && t.dateOnly === todayStr) || (t.date && t.date.includes(new Date().toLocaleDateString())))
  );

  const flattenedTodaysTransactions = [];
  todaysTransactionsRaw.forEach((t) => {
    if (!t) return;
    if (t.isOrderGroup && Array.isArray(t.items)) {
      t.items.forEach((item) => {
        flattenedTodaysTransactions.push({
          title: item.name,
          amount: (item.price || 0) * (item.qty || 1),
          quantity: item.qty || 1,
          date: t.date || todayStr
        });
      });
    } else {
      flattenedTodaysTransactions.push({
        title: t.title || "Unknown",
        amount: t.amount || 0,
        quantity: t.quantity || 1,
        date: t.date || todayStr
      });
    }
  });

  const todaysSales = todaysTransactionsRaw.reduce((acc, t) => acc + (t.amount || 0), 0);
  const todaysOrders = todaysTransactionsRaw.length;

  const todaysProfit = flattenedTodaysTransactions.reduce((acc, t) => {
    if (!t || !t.title) return acc;

    const matchedProduct = products.find(
      (p) => p && p.name && t.title && p.name.toLowerCase() === t.title.toLowerCase()
    );

    let profitPerUnit = 0;
    if (matchedProduct) {
      const sell = parseFloat(matchedProduct.sell) || 0;
      const buy = parseFloat(matchedProduct.buy) || 0;
      profitPerUnit = sell - buy;
    } else {
      profitPerUnit = ((t.amount || 0) / parseInt(t.quantity || 1)) * 0.3;
    }
    return acc + profitPerUnit * parseInt(t.quantity || 1);
  }, 0);

  const cards = [
    {
      id: "sales",
      title: "Today's Sales",
      value: `৳ ${todaysSales}`,
      color: "from-emerald-500 to-teal-600",
      icon: DollarSign,
    },
    {
      id: "orders",
      title: "Orders",
      value: todaysOrders.toString(),
      color: "from-blue-500 to-indigo-600",
      icon: ShoppingCart,
    },
    {
      id: "profit",
      title: "Profit",
      value: `৳ ${Math.round(todaysProfit)}`,
      color: "from-purple-500 to-pink-600",
      icon: TrendingUp,
    },
  ];

  const downloadPDFReport = () => {
    const printWindow = window.open('', '_blank');
    
    let reportTitle = "";
    let tableHeaders = "";
    let tableRows = "";

    if (selectedCard === "sales") {
      reportTitle = "Today's Sales Report";
      tableHeaders = `<th>Product Name</th><th>Quantity</th><th>Amount</th><th>Date / Time</th>`;
      tableRows = flattenedTodaysTransactions.length === 0 ? 
        '<tr><td colspan="4" style="text-align:center;">No records found for today.</td></tr>' : 
        flattenedTodaysTransactions.map(t => `
          <tr>
            <td>${t?.title || "Unknown"}</td>
            <td>${t?.quantity || 1} pcs</td>
            <td class="amount">৳ ${t?.amount || 0}</td>
            <td>${t?.date || todayStr}</td>
          </tr>
        `).join('');
    } else if (selectedCard === "orders") {
      reportTitle = "Today's Orders Report";
      tableHeaders = `<th>Order ID / Details</th><th>Total Amount</th><th>Date / Time</th>`;
      tableRows = todaysTransactionsRaw.length === 0 ? 
        '<tr><td colspan="3" style="text-align:center;">No orders found for today.</td></tr>' : 
        todaysTransactionsRaw.map((t, idx) => `
          <tr>
            <td>Order #${idx + 1} (${t.items ? t.items.map(i => `${i.name} (${i.qty}x)`).join(', ') : (t.title || "Order")})</td>
            <td class="amount">৳ ${t?.amount || 0}</td>
            <td>${t?.date || todayStr}</td>
          </tr>
        `).join('');
    } else if (selectedCard === "profit") {
      reportTitle = "Today's Profit Report";
      tableHeaders = `<th>Product Name</th><th>Quantity</th><th>Estimated Profit</th><th>Date / Time</th>`;
      tableRows = flattenedTodaysTransactions.length === 0 ? 
        '<tr><td colspan="4" style="text-align:center;">No records found for today.</td></tr>' : 
        flattenedTodaysTransactions.map(t => {
          if (!t) return '';
          const matchedProduct = products.find((p) => p && p.name && t.title && p.name.toLowerCase() === t.title.toLowerCase());
          let itemProfit = 0;
          if (matchedProduct) {
            itemProfit = (parseFloat(matchedProduct.sell || 0) - parseFloat(matchedProduct.buy || 0)) * parseInt(t.quantity || 1);
          } else {
            itemProfit = (t.amount || 0) * 0.3;
          }
          return `
            <tr>
              <td>${t.title || "Unknown"}</td>
              <td>${t.quantity || 1} pcs</td>
              <td class="amount" style="color: #7c3aed;">৳ ${Math.round(itemProfit)}</td>
              <td>${t.date || todayStr}</td>
            </tr>
          `;
        }).join('');
    }

    const htmlContent = `
      <html>
        <head>
          <title>${reportTitle} - ${todayStr}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; color: #184E2E; }
            .summary { margin-bottom: 20px; font-size: 14px; background: #f5f8f6; padding: 15px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #184E2E; color: white; }
            .amount { color: #184E2E; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${reportTitle}</h2>
          <div class="summary">
            <p><strong>Report Date:</strong> ${todayStr}</p>
            <p><strong>Active View:</strong> ${cards.find(c => c.id === selectedCard)?.title}</p>
            ${selectedCard === 'sales' ? `<p><strong>Total Sales:</strong> ৳ ${todaysSales}</p>` : ''}
            ${selectedCard === 'orders' ? `<p><strong>Total Orders:</strong> ${todaysOrders}</p>` : ''}
            ${selectedCard === 'profit' ? `<p><strong>Total Estimated Profit:</strong> ৳ ${Math.round(todaysProfit)}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableRows}
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

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8 font-sans antialiased pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 sm:p-3 bg-white/70 rounded-2xl shadow-sm border border-slate-200/60 hover:bg-white transition-all text-slate-700 shrink-0 cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0b5d2a]">
              Dashboard Analytics
            </h1>
              </div>
        </div>

        <button
          onClick={downloadPDFReport}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl shadow-sm transition-all font-bold text-xs sm:text-sm cursor-pointer shadow-emerald-900/10 active:scale-95"
        >
          <FileText size={16} />
          <span>Download PDF Report 📥</span>
        </button>
      </div>

      {/* Metric Cards Grid (Glassmorphism & Fully Mobile Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {cards.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedCard === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedCard(item.id)}
              className={`bg-white/70  rounded-2xl sm:rounded-[24px] p-4 sm:p-5 shadow-sm cursor-pointer border transition-all duration-300 group hover:shadow-md hover:bg-white/90 ${
                isSelected 
                  ? "border-emerald-500/80 ring-2 ring-emerald-500/20 bg-white/90 shadow-md -translate-y-0.5" 
                  : "border-slate-200/60 hover:-translate-y-0.5"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-400 font-semibold text-[11px] sm:text-xs uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 text-slate-800 tracking-tight">
                    {item.value}
                  </h2>
                </div>
                <div
                  className={`bg-gradient-to-br ${item.color} w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-600 font-semibold mt-3 sm:mt-4 flex items-center gap-1">
                {isSelected ? "Showing Details Below 👇" : "Click to view details 👆"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Dynamic Details Section Based on Clicked Card */}
      <div className="mt-4 sm:mt-6 bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-slate-200/60">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200/60 gap-2">
          <h3 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight capitalize">
            {selectedCard === "sales" && "Today's Sales Breakdown"}
            {selectedCard === "orders" && "Today's Orders List"}
            {selectedCard === "profit" && "Today's Profit Breakdown"}
          </h3>
          <span className="text-[11px] sm:text-xs bg-emerald-500/10 text-emerald-800 px-3 py-1 rounded-full font-bold border border-emerald-500/20 shadow-sm">
            Today: {todayStr}
          </span>
        </div>

        {/* Sales & Profit View */}
        {(selectedCard === "sales" || selectedCard === "profit") && (
          <div>
            {flattenedTodaysTransactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-xs sm:text-sm font-medium">No records found for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-bold">Product Name</th>
                      <th className="pb-3 font-bold">Quantity</th>
                      <th className="pb-3 font-bold">{selectedCard === "profit" ? "Estimated Profit" : "Amount"}</th>
                      <th className="pb-3 font-bold">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 text-xs sm:text-sm">
                    {flattenedTodaysTransactions.map((t, idx) => {
                      if (!t) return null;
                      const matchedProduct = products.find((p) => p && p.name && t.title && p.name.toLowerCase() === t.title.toLowerCase());
                      let itemProfit = 0;
                      if (matchedProduct) {
                        itemProfit = (parseFloat(matchedProduct.sell || 0) - parseFloat(matchedProduct.buy || 0)) * parseInt(t.quantity || 1);
                      } else {
                        itemProfit = (t.amount || 0) * 0.3;
                      }

                      return (
                        <tr key={idx} className="hover:bg-white/50 transition-colors">
                          <td className="py-3 font-bold text-slate-700">{t.title || "Unknown"}</td>
                          <td className="py-3 text-slate-600 font-medium">{t.quantity || 1} pcs</td>
                          <td className="py-3 font-black text-emerald-600">
                            {selectedCard === "profit" ? `৳ ${Math.round(itemProfit)}` : `৳ ${t.amount || 0}`}
                          </td>
                          <td className="py-3 text-slate-400 text-[11px] sm:text-xs font-medium">{t.date || todayStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders View */}
        {selectedCard === "orders" && (
          <div>
            {todaysTransactionsRaw.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-xs sm:text-sm font-medium">No orders found for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-bold">Order Details</th>
                      <th className="pb-3 font-bold">Total Amount</th>
                      <th className="pb-3 font-bold">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 text-xs sm:text-sm">
                    {todaysTransactionsRaw.map((t, idx) => {
                      if (!t) return null;
                      const orderSummary = t.items 
                        ? t.items.map(i => `${i.name} (${i.qty} pcs)`).join(', ') 
                        : (t.title ? `${t.title} (${t.quantity || 1} pcs)` : "Single Order");

                      return (
                        <tr key={idx} className="hover:bg-white/50 transition-colors">
                          <td className="py-3 font-bold text-slate-700">
                            Order #{idx + 1}: <span className="text-slate-600 font-normal">{orderSummary}</span>
                          </td>
                          <td className="py-3 font-black text-emerald-600">৳ {t.amount || 0}</td>
                          <td className="py-3 text-slate-400 text-[11px] sm:text-xs font-medium">{t.date || todayStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}