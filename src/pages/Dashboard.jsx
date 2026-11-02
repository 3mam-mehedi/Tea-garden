import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowLeft,
  FileText,
} from "lucide-react";

import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Dashboard({ onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCard, setSelectedCard] = useState("sales");

  // ==========================================
  // FIREBASE REALTIME DATA
  // ==========================================
  useEffect(() => {
    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        setTransactions(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      },
      (error) => {
        console.error("Transactions load error:", error);
      }
    );

    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      },
      (error) => {
        console.error("Products load error:", error);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeProducts();
    };
  }, []);

  // ==========================================
  // DATE HELPERS
  // ==========================================
  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Firestore Timestamp / ISO string / old date string
  const getTransactionDateTime = (transaction) => {
    if (!transaction) return null;

    // New records: Firestore Timestamp
    if (
      transaction.createdAt &&
      typeof transaction.createdAt.toDate === "function"
    ) {
      return transaction.createdAt.toDate();
    }

    // ISO date string fallback
    if (
      typeof transaction.createdAt === "string" &&
      transaction.createdAt.trim()
    ) {
      const parsedCreatedAt = new Date(transaction.createdAt);

      if (!Number.isNaN(parsedCreatedAt.getTime())) {
        return parsedCreatedAt;
      }
    }

    // Older records: date string with time
    // Example: 11/3/2026 at 04:30 PM
    const dateText = transaction.date;

    if (typeof dateText !== "string") return null;

    const match = dateText.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (match) {
      const [, month, day, year, hourText, minuteText, periodText] = match;

      let hour = Number(hourText);
      const minute = Number(minuteText);
      const period = periodText.toUpperCase();

      if (
        Number(month) < 1 ||
        Number(month) > 12 ||
        Number(day) < 1 ||
        Number(day) > 31 ||
        hour < 1 ||
        hour > 12 ||
        minute < 0 ||
        minute > 59
      ) {
        return null;
      }

      if (period === "AM" && hour === 12) hour = 0;
      if (period === "PM" && hour !== 12) hour += 12;

      const parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        hour,
        minute
      );

      if (
        parsedDate.getFullYear() !== Number(year) ||
        parsedDate.getMonth() !== Number(month) - 1 ||
        parsedDate.getDate() !== Number(day)
      ) {
        return null;
      }

      return parsedDate;
    }

    // Another possible old format:
    // YYYY-MM-DD at 04:30 PM
    const alternateMatch = dateText.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (alternateMatch) {
      const [, year, month, day, hourText, minuteText, periodText] =
        alternateMatch;

      let hour = Number(hourText);
      const minute = Number(minuteText);
      const period = periodText.toUpperCase();

      if (
        Number(month) < 1 ||
        Number(month) > 12 ||
        Number(day) < 1 ||
        Number(day) > 31 ||
        hour < 1 ||
        hour > 12 ||
        minute < 0 ||
        minute > 59
      ) {
        return null;
      }

      if (period === "AM" && hour === 12) hour = 0;
      if (period === "PM" && hour !== 12) hour += 12;

      const parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        hour,
        minute
      );

      if (
        parsedDate.getFullYear() !== Number(year) ||
        parsedDate.getMonth() !== Number(month) - 1 ||
        parsedDate.getDate() !== Number(day)
      ) {
        return null;
      }

      return parsedDate;
    }

    return null;
  };

  // ==========================================
  // REPORT PERIOD: 3 PM TO NEXT DAY 7 AM
  // ==========================================
  const now = new Date();

  const reportStart = new Date(now);
  reportStart.setHours(15, 0, 0, 0);

  // Before 3 PM, the active report started yesterday.
  if (now.getHours() < 15) {
    reportStart.setDate(reportStart.getDate() - 1);
  }

  const reportEnd = new Date(reportStart);
  reportEnd.setDate(reportEnd.getDate() + 1);
  reportEnd.setHours(7, 0, 0, 0);

  const todayStr = getLocalDateString(reportStart);

  const reportDateLabel = reportStart.toLocaleDateString();

  // ==========================================
  // FILTER TRANSACTIONS
  // 3:00 PM inclusive, next day 7:00 AM exclusive
  // ==========================================
  const todaysTransactionsRaw = transactions.filter((transaction) => {
    if (!transaction || transaction.type !== "income") {
      return false;
    }

    const transactionDate = getTransactionDateTime(transaction);

    if (!transactionDate) {
      return false;
    }

    return (
      transactionDate >= reportStart &&
      transactionDate < reportEnd
    );
  });

  // ==========================================
  // FLATTEN TRANSACTIONS FOR PRODUCT REPORTS
  // ==========================================
  const flattenedTodaysTransactions = [];

  todaysTransactionsRaw.forEach((transaction) => {
    if (!transaction) return;

    if (
      transaction.isOrderGroup &&
      Array.isArray(transaction.items)
    ) {
      transaction.items.forEach((item) => {
        flattenedTodaysTransactions.push({
          title: item.name || "Unknown",
          amount:
            (Number(item.price) || 0) *
            (Number(item.qty) || 1),
          quantity: Number(item.qty) || 1,
          date: transaction.date || todayStr,
        });
      });
    } else {
      flattenedTodaysTransactions.push({
        title: transaction.title || "Unknown",
        amount: Number(transaction.amount) || 0,
        quantity: Number(transaction.quantity) || 1,
        date: transaction.date || todayStr,
      });
    }
  });

  // ==========================================
  // SALES / ORDERS / PROFIT
  // ==========================================
  const todaysSales = todaysTransactionsRaw.reduce(
    (total, transaction) =>
      total + (Number(transaction.amount) || 0),
    0
  );

  const todaysOrders = todaysTransactionsRaw.length;

  const calculateItemProfit = (transactionItem) => {
    if (!transactionItem || !transactionItem.title) return 0;

    const matchedProduct = products.find(
      (product) =>
        product &&
        product.name &&
        product.name.toLowerCase() ===
          transactionItem.title.toLowerCase()
    );

    const quantity = Number(transactionItem.quantity) || 1;

    if (matchedProduct) {
      const sell = Number(matchedProduct.sell) || 0;
      const buy = Number(matchedProduct.buy) || 0;

      return (sell - buy) * quantity;
    }

    // Fallback estimate when product is unavailable.
    return (Number(transactionItem.amount) || 0) * 0.3;
  };

  const todaysProfit = flattenedTodaysTransactions.reduce(
    (total, transactionItem) =>
      total + calculateItemProfit(transactionItem),
    0
  );

  // ==========================================
  // DASHBOARD CARDS
  // ==========================================
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

  // ==========================================
  // PDF REPORT
  // ==========================================
  const downloadPDFReport = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to download the report.");
      return;
    }

    let reportTitle = "";
    let tableHeaders = "";
    let tableRows = "";

    if (selectedCard === "sales") {
      reportTitle = "Sales Report";

      tableHeaders = `
        <th>Product Name</th>
        <th>Quantity</th>
        <th>Amount</th>
        <th>Date / Time</th>
      `;

      tableRows =
        flattenedTodaysTransactions.length === 0
          ? '<tr><td colspan="4" style="text-align:center;">No records found for this period.</td></tr>'
          : flattenedTodaysTransactions
              .map(
                (item) => `
                  <tr>
                    <td>${item.title || "Unknown"}</td>
                    <td>${item.quantity || 1} pcs</td>
                    <td class="amount">৳ ${item.amount || 0}</td>
                    <td>${item.date || todayStr}</td>
                  </tr>
                `
              )
              .join("");
    } else if (selectedCard === "orders") {
      reportTitle = "Orders Report";

      tableHeaders = `
        <th>Order ID / Details</th>
        <th>Total Amount</th>
        <th>Date / Time</th>
      `;

      tableRows =
        todaysTransactionsRaw.length === 0
          ? '<tr><td colspan="3" style="text-align:center;">No orders found for this period.</td></tr>'
          : todaysTransactionsRaw
              .map((transaction, index) => {
                const details = Array.isArray(transaction.items)
                  ? transaction.items
                      .map(
                        (item) =>
                          `${item.name} (${item.qty}x)`
                      )
                      .join(", ")
                  : transaction.title || "Order";

                return `
                  <tr>
                    <td>Order #${index + 1} (${details})</td>
                    <td class="amount">৳ ${transaction.amount || 0}</td>
                    <td>${transaction.date || todayStr}</td>
                  </tr>
                `;
              })
              .join("");
    } else if (selectedCard === "profit") {
      reportTitle = "Profit Report";

      tableHeaders = `
        <th>Product Name</th>
        <th>Quantity</th>
        <th>Estimated Profit</th>
        <th>Date / Time</th>
      `;

      tableRows =
        flattenedTodaysTransactions.length === 0
          ? '<tr><td colspan="4" style="text-align:center;">No records found for this period.</td></tr>'
          : flattenedTodaysTransactions
              .map((item) => {
                const itemProfit = calculateItemProfit(item);

                return `
                  <tr>
                    <td>${item.title || "Unknown"}</td>
                    <td>${item.quantity || 1} pcs</td>
                    <td class="amount" style="color:#7c3aed;">
                      ৳ ${Math.round(itemProfit)}
                    </td>
                    <td>${item.date || todayStr}</td>
                  </tr>
                `;
              })
              .join("");
    }

    const selectedCardTitle =
      cards.find((card) => card.id === selectedCard)?.title || "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${reportTitle} - ${reportDateLabel}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h2 {
              text-align: center;
              color: #184E2E;
            }
            .summary {
              margin-bottom: 20px;
              font-size: 14px;
              background: #f5f8f6;
              padding: 15px;
              border-radius: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #184E2E;
              color: white;
            }
            .amount {
              color: #184E2E;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h2>${reportTitle}</h2>

          <div class="summary">
            <p><strong>Report Date:</strong> ${reportDateLabel}</p>
            <p><strong>Report Period:</strong> 3:00 PM – 7:00 AM</p>
            <p><strong>Active View:</strong> ${selectedCardTitle}</p>

            ${
              selectedCard === "sales"
                ? `<p><strong>Total Sales:</strong> ৳ ${todaysSales}</p>`
                : ""
            }

            ${
              selectedCard === "orders"
                ? `<p><strong>Total Orders:</strong> ${todaysOrders}</p>`
                : ""
            }

            ${
              selectedCard === "profit"
                ? `<p><strong>Total Estimated Profit:</strong> ৳ ${Math.round(todaysProfit)}</p>`
                : ""
            }
          </div>

          <table>
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ==========================================
  // UI — PRESERVED FROM YOUR ORIGINAL VERSION
  // ==========================================
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
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {cards.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedCard === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedCard(item.id)}
              className={`bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-5 shadow-sm cursor-pointer border transition-all duration-300 group hover:shadow-md hover:bg-white/90 ${
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
                {isSelected
                  ? "Showing Details Below"
                  : "Click to view details"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Dynamic Details Section */}
      <div className="mt-4 sm:mt-6 bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-slate-200/60">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200/60 gap-2">
          <h3 className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight capitalize">
            {selectedCard === "sales" && "Today's Sales Breakdown"}
            {selectedCard === "orders" && "Today's Orders List"}
            {selectedCard === "profit" && "Today's Profit Breakdown"}
          </h3>

          <span className="text-[11px] sm:text-xs bg-emerald-500/10 text-emerald-800 px-3 py-1 rounded-full font-bold border border-emerald-500/20 shadow-sm">
            Report: {reportDateLabel}
          </span>
        </div>

        {/* Sales & Profit View */}
        {(selectedCard === "sales" || selectedCard === "profit") && (
          <div>
            {flattenedTodaysTransactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-xs sm:text-sm font-medium">
                No records found for this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-bold">Product Name</th>
                      <th className="pb-3 font-bold">Quantity</th>
                      <th className="pb-3 font-bold">
                        {selectedCard === "profit"
                          ? "Estimated Profit"
                          : "Amount"}
                      </th>
                      <th className="pb-3 font-bold">Date / Time</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200/40 text-xs sm:text-sm">
                    {flattenedTodaysTransactions.map((item, index) => {
                      if (!item) return null;

                      const itemProfit = calculateItemProfit(item);

                      return (
                        <tr
                          key={index}
                          className="hover:bg-white/50 transition-colors"
                        >
                          <td className="py-3 font-bold text-slate-700">
                            {item.title || "Unknown"}
                          </td>

                          <td className="py-3 text-slate-600 font-medium">
                            {item.quantity || 1} pcs
                          </td>

                          <td className="py-3 font-black text-emerald-600">
                            {selectedCard === "profit"
                              ? `৳ ${Math.round(itemProfit)}`
                              : `৳ ${item.amount || 0}`}
                          </td>

                          <td className="py-3 text-slate-400 text-[11px] sm:text-xs font-medium">
                            {item.date || todayStr}
                          </td>
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
              <p className="text-slate-400 text-center py-8 text-xs sm:text-sm font-medium">
                No orders found for this period.
              </p>
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
                    {todaysTransactionsRaw.map((transaction, index) => {
                      if (!transaction) return null;

                      const orderSummary = Array.isArray(
                        transaction.items
                      )
                        ? transaction.items
                            .map(
                              (item) =>
                                `${item.name} (${item.qty} pcs)`
                            )
                            .join(", ")
                        : transaction.title
                          ? `${transaction.title} (${transaction.quantity || 1} pcs)`
                          : "Single Order";

                      return (
                        <tr
                          key={transaction.id || index}
                          className="hover:bg-white/50 transition-colors"
                        >
                          <td className="py-3 font-bold text-slate-700">
                            Order #{index + 1}:{" "}
                            <span className="text-slate-600 font-normal">
                              {orderSummary}
                            </span>
                          </td>

                          <td className="py-3 font-black text-emerald-600">
                            ৳ {transaction.amount || 0}
                          </td>

                          <td className="py-3 text-slate-400 text-[11px] sm:text-xs font-medium">
                            {transaction.date || todayStr}
                          </td>
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