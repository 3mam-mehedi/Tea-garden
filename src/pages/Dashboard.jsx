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

  // আজকের ট্রানজেকশন ফিল্টার
  const todaysTransactionsRaw = transactions.filter(
    (t) => t && t.type === "income" && ((t.dateOnly && t.dateOnly === todayStr) || (t.date && t.date.includes(new Date().toLocaleDateString())))
  );

  // অর্ডার গ্রুপগুলোকে ভেঙে আলাদা আইটেমে রূপান্তর (ফ্ল্যাটেন করা) যাতে টেবিলে প্রতিটি প্রোডাক্টের নাম ও পরিমাণ সঠিকভাবে দেখানো যায়
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

  // 🔴 Total Products কার্ড বাদ দিয়ে ৩টি কার্ড রাখা হলো
  const cards = [
    {
      id: "sales",
      title: "Today's Sales",
      value: `৳ ${todaysSales}`,
      color: "bg-green-600",
      icon: DollarSign,
    },
    {
      id: "orders",
      title: "Orders",
      value: todaysOrders.toString(),
      color: "bg-blue-600",
      icon: ShoppingCart,
    },
    {
      id: "profit",
      title: "Profit",
      value: `৳ ${Math.round(todaysProfit)}`,
      color: "bg-purple-600",
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
    <div className="bg-[#F5F8F6] min-h-screen p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#184E2E]">
              Dashboard Analytics
            </h1>
            <p className="text-gray-500 mt-1">
              Detailed breakdown of your business performance
            </p>
          </div>
        </div>

        <button
          onClick={downloadPDFReport}
          className="flex items-center gap-2 bg-[#184E2E] hover:bg-[#0B5D2A] text-white px-6 py-3 rounded-2xl shadow-md transition-all font-semibold text-sm"
        >
          <FileText size={18} />
          Download PDF Report 📥
        </button>
      </div>

      {/* Metric Cards (Grid-cols-3) */}
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedCard === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedCard(item.id)}
              className={`bg-white rounded-3xl p-6 shadow-sm cursor-pointer border transition-all group ${
                isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md" : "border-gray-100 hover:border-emerald-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 font-medium group-hover:text-[#184E2E] transition-colors text-sm">
                    {item.title}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-3 text-gray-800">
                    {item.value}
                  </h2>
                </div>
                <div
                  className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon size={24} />
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-4 flex items-center gap-1">
                {isSelected ? "Showing Details Below 👇" : "Click to view details 👆"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Dynamic Details Section Based on Clicked Card */}
      <div className="mt-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 capitalize">
            {selectedCard === "sales" && "Today's Sales Breakdown"}
            {selectedCard === "orders" && "Today's Orders List"}
            {selectedCard === "profit" && "Today's Profit Breakdown"}
          </h3>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-semibold border border-emerald-200">
            Today: {todayStr}
          </span>
        </div>

        {/* Sales & Profit View */}
        {(selectedCard === "sales" || selectedCard === "profit") && (
          <div>
            {flattenedTodaysTransactions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No records found for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Product Name</th>
                      <th className="pb-3 font-semibold">Quantity</th>
                      <th className="pb-3 font-semibold">{selectedCard === "profit" ? "Estimated Profit" : "Amount"}</th>
                      <th className="pb-3 font-semibold">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
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
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-gray-800">{t.title || "Unknown"}</td>
                          <td className="py-3 text-gray-600">{t.quantity || 1} pcs</td>
                          <td className="py-3 font-bold text-emerald-600">
                            {selectedCard === "profit" ? `৳ ${Math.round(itemProfit)}` : `৳ ${t.amount || 0}`}
                          </td>
                          <td className="py-3 text-gray-400 text-xs">{t.date || todayStr}</td>
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
              <p className="text-gray-400 text-center py-8">No orders found for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Order Details</th>
                      <th className="pb-3 font-semibold">Total Amount</th>
                      <th className="pb-3 font-semibold">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {todaysTransactionsRaw.map((t, idx) => {
                      if (!t) return null;
                      const orderSummary = t.items 
                        ? t.items.map(i => `${i.name} (${i.qty} pcs)`).join(', ') 
                        : (t.title ? `${t.title} (${t.quantity || 1} pcs)` : "Single Order");

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3 font-medium text-gray-800">
                            Order #{idx + 1}: <span className="text-gray-600 font-normal">{orderSummary}</span>
                          </td>
                          <td className="py-3 font-bold text-emerald-600">৳ {t.amount || 0}</td>
                          <td className="py-3 text-gray-400 text-xs">{t.date || todayStr}</td>
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