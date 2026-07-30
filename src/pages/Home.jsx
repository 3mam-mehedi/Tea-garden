import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Package, Flame, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import styled from 'styled-components';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2.5 sm:p-3 rounded-2xl text-xs bg-white/80 backdrop-blur-md shadow-xl border border-white/40">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-blue-600 font-semibold">
          চলতি সপ্তাহ: ৳{payload[0].value.toLocaleString()}
        </p>
        <p className="text-emerald-600 font-semibold">
          গত সপ্তাহ: ৳{payload[1]?.value?.toLocaleString() || 0}
        </p>
      </div>
    );
  }
  return null;
};

export default function Home() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);

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

  const flattenedTransactions = [];
  transactions.forEach((t) => {
    if (!t) return;
    if (t.isOrderGroup && Array.isArray(t.items)) {
      t.items.forEach((item) => {
        flattenedTransactions.push({
          title: item.name,
          amount: (item.price || 0) * (item.qty || 1),
          quantity: item.qty || 1,
          type: t.type || "income",
          dateOnly: t.dateOnly || (t.date ? t.date.split(",")[0] : ""),
          date: t.date
        });
      });
    } else {
      flattenedTransactions.push(t);
    }
  });

  const todaysTransactions = transactions.filter(
    (t) => t && t.type === "income" && ((t.dateOnly && t.dateOnly === todayStr) || (t.date && t.date.includes(new Date().toLocaleDateString())))
  );

  const todaysSales = todaysTransactions.reduce((acc, t) => {
    return acc + (t.amount || 0);
  }, 0);

  const todaysOrders = todaysTransactions.length;

  const todaysProfit = todaysTransactions.reduce((acc, t) => {
    let itemsToProcess = [];
    if (t.isOrderGroup && Array.isArray(t.items)) {
      itemsToProcess = t.items;
    } else if (t.title) {
      itemsToProcess = [{ name: t.title, price: t.amount / (t.quantity || 1), qty: t.quantity || 1 }];
    }

    let orderProfit = 0;
    itemsToProcess.forEach((item) => {
      const matchedProduct = products.find(
        (p) => p && p.name && item.name && p.name.toLowerCase() === item.name.toLowerCase()
      );
      
      let profitPerUnit = 0;
      if (matchedProduct) {
        const sell = parseFloat(matchedProduct.sell) || 0;
        const buy = parseFloat(matchedProduct.buy) || 0;
        profitPerUnit = sell - buy;
      } else {
        profitPerUnit = ((item.price || 0)) * 0.3;
      }
      orderProfit += profitPerUnit * (item.qty || 1);
    });

    return acc + orderProfit;
  }, 0);

  const todayItemCounts = {};
  const todaysFlattened = flattenedTransactions.filter(
    (t) => t && t.type === "income" && ((t.dateOnly && t.dateOnly === todayStr) || (t.date && t.date.includes(new Date().toLocaleDateString())))
  );
  todaysFlattened.forEach((t) => {
    if (t && t.title) {
      const qty = parseInt(t.quantity || 1);
      todayItemCounts[t.title] = (todayItemCounts[t.title] || 0) + qty;
    }
  });

  let bestProductTitle = "None";
  let maxQtyToday = 0;
  Object.entries(todayItemCounts).forEach(([name, qty]) => {
    if (qty > maxQtyToday) {
      maxQtyToday = qty;
      bestProductTitle = name;
    }
  });

  const matchedBestProductObj = products.find(
    (p) => p && p.name && bestProductTitle !== "None" && p.name.toLowerCase() === bestProductTitle.toLowerCase()
  );
  const bestProductImage = matchedBestProductObj?.image || matchedBestProductObj?.img || null;

  const lowStockItems = products.filter((p) => p && !p.isUnlimited && (parseInt(p.stock) || 0) <= 5);

  const overallItemCounts = {};
  flattenedTransactions
    .filter((t) => t && t.type === "income" && t.title)
    .forEach((t) => {
      const qty = parseInt(t.quantity || 1);
      overallItemCounts[t.title] = (overallItemCounts[t.title] || 0) + qty;
    });

  const topSellingList = Object.entries(overallItemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const dayNamesBangla = {
    "Sun": "রবি",
    "Mon": "সোম",
    "Tue": "মঙ্গল",
    "Wed": "বুধ",
    "Thu": "বৃহস্পতি",
    "Fri": "শুক্র",
    "Sat": "শনি"
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const enDay = d.toLocaleDateString("en-US", { weekday: "short" });
    return {
      dateStr: getLocalDateString(d),
      dayName: dayNamesBangla[enDay] || enDay
    };
  });

  const weeklyData = last7Days.map(({ dateStr, dayName }, index) => {
    const currentDayTotal = transactions
      .filter((t) => t && t.type === "income" && t.dateOnly === dateStr)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const prevDateObj = new Date();
    prevDateObj.setDate(prevDateObj.getDate() - (6 - index) - 7);
    const prevDateStr = getLocalDateString(prevDateObj);

    const prevDayTotal = transactions
      .filter((t) => t && t.type === "income" && t.dateOnly === prevDateStr)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    return { 
      day: dayName, 
      currentWeek: currentDayTotal, 
      previousWeek: prevDayTotal 
    };
  });

  const totalWeeklySales = weeklyData.reduce((acc, curr) => acc + curr.currentWeek, 0);
  const totalPrevWeeklySales = weeklyData.reduce((acc, curr) => acc + curr.previousWeek, 0);

  const cards = [
    {
      title: "Today's Sales",
      value: `৳ ${todaysSales}`,
      color: "from-emerald-500 to-teal-600",
      icon: DollarSign,
    },
    {
      title: "Orders",
      value: todaysOrders.toString(),
      color: "from-blue-500 to-indigo-600",
      icon: ShoppingCart,
    },
    {
      title: "Profit",
      value: `৳ ${Math.round(todaysProfit)}`,
      color: "from-purple-500 to-pink-600",
      icon: TrendingUp,
    },
  ];

  return (
    <StyledWrapper>
      {/* কোনো অতিরিক্ত ব্যাকগ্রাউন্ড ক্লাস ছাড়া শুধুমাত্র স্বাভাবিক কন্টেইনার */}
      <div className="p-3 sm:p-6 font-sans antialiased pb-20">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-2">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0b5d2a]">
              Dashboard
            </h1>
             </div>
        </div>

        {/* Top Cards Grid with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          {cards.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                onClick={() => navigate("/dashboard")}
                className="bg-white/70  rounded-2xl sm:rounded-[24px] p-4 sm:p-5 shadow-sm cursor-pointer hover:shadow-md hover:bg-white/90 hover:-translate-y-0.5 border border-slate-200/60 transition-all duration-300 group"
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
              </div>
            );
          })}
        </div>

        {/* Best Product Glass Banner */}
        <div className="mt-4 sm:mt-5 bg-gradient-to-r from-emerald-800/90 via-teal-800/90 to-emerald-900/90  rounded-2xl sm:rounded-[28px] p-4 sm:p-6 shadow-sm text-white relative overflow-hidden flex flex-col sm:flex-row items-center justify-between border border-emerald-700/30 gap-4">
          <div className="z-10 text-center sm:text-left w-full sm:w-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] sm:text-xs font-bold tracking-wide uppercase text-emerald-200 mb-2">
              <Flame size={13} className="text-amber-300 fill-amber-300 animate-pulse" />
              Best Product Today
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white truncate max-w-full sm:max-w-md">
              {bestProductTitle}
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium mt-1">
              Over <span className="text-amber-300 font-bold underline decoration-amber-300/60">{maxQtyToday} Units</span> served to satisfied customers today!
            </p>
          </div>

          <div className="z-10 shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white/10 p-1.5 sm:p-2 shadow-inner flex items-center justify-center border-2 border-white/30 overflow-hidden transform hover:scale-105 transition-transform duration-300">
              {bestProductImage ? (
                <img src={bestProductImage} alt={bestProductTitle} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-black text-xl sm:text-2xl">
                  {bestProductTitle !== "None" ? bestProductTitle.charAt(0).toUpperCase() : "⭐"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Glass Box */}
        <div className="mt-4 sm:mt-5 bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 sm:p-1.5 bg-rose-500/10 rounded-lg sm:rounded-xl text-rose-500">
              <AlertTriangle size={15} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Low Stock Alerts</h4>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold py-1">✨ All product stocks are in safe levels!</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-24 overflow-y-auto pr-1">
              {lowStockItems.map((item) => (
                <span key={item.id} className="text-[11px] sm:text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 px-2.5 py-1 rounded-xl font-semibold shadow-sm backdrop-blur-sm">
                  {item.name} <span className="opacity-75">(Stock: {item.stock})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main Grid Row for Weekly Chart & Top Selling Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mt-4 sm:mt-5 items-stretch">
          
          {/* Weekly Sales Chart Card */}
          <div className="lg:col-span-7 bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-emerald-500/20">
                    Performance
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-1.5 sm:mt-2">
                    সাপ্তাহিক বিক্রয় বিশ্লেষণ
                  </h3>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-600 inline-block" />
                    <span className="text-slate-600">চলতি সপ্তাহ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-slate-600">গত সপ্তাহ</span>
                  </div>
                </div>
              </div>

              {/* Recharts Area Chart */}
              <div className="h-56 sm:h-72 w-full bg-white/40 rounded-xl sm:rounded-2xl p-1 sm:p-4 border border-slate-200/50">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                    
                    <XAxis 
                      dataKey="day" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }} 
                    />
                    
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => `৳${value >= 1000 ? value / 1000 + 'K' : value}`}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Area 
                      type="monotone" 
                      dataKey="currentWeek" 
                      stroke="#2563eb" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorCurrent)" 
                      dot={{ r: 3, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 5, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                    />
                    
                    <Area 
                      type="monotone" 
                      dataKey="previousWeek" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorPrevious)" 
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-500 gap-2">
              <span>সর্বশেষ আপডেট: এইমাত্র</span>
              <div className="bg-white/60 border border-slate-200/60 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center shadow-sm">
                <span className="font-medium text-slate-700">চলতি: <strong className="text-blue-600">৳{totalWeeklySales}</strong></span>
                <span className="text-slate-300">|</span>
                <span className="font-medium text-slate-700">গত সপ্তাহ: <strong className="text-emerald-500">৳{totalPrevWeeklySales}</strong></span>
              </div>
            </div>

            <button 
              onClick={() => navigate("/dashboard")}
              className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 bg-slate-900/90 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Detailed Report</span>
              <ArrowUpRight size={15} />
            </button>
          </div>

          {/* Top Selling Products Glass Card */}
          <div className="lg:col-span-5 bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-lg text-slate-800 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-200/50 tracking-tight">
                Top Selling Products
              </h3>
              {topSellingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-slate-400">
                  <Package size={32} className="mb-2 opacity-40" />
                  <p className="text-xs font-medium">No sales data available yet</p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {topSellingList.map(([name, qty], idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/50 hover:bg-white/90 border border-slate-200/60 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-sm">
                      <span className="text-xs sm:text-sm font-bold text-slate-700 truncate max-w-[180px] sm:max-w-[200px]">{name}</span>
                      <span className="text-[11px] sm:text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-black shadow-sm shrink-0">
                        {qty} Sold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-emerald-900/10"
            >
              View All Products
            </button>
          </div>

        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div``;