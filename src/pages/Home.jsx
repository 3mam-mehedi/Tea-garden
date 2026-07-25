import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Package, Flame } from "lucide-react";
import styled from 'styled-components';

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

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: getLocalDateString(d),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)
    };
  });

  const weeklyData = last7Days.map(({ dateStr, dayName }) => {
    const dayTotal = transactions
      .filter((t) => t && t.type === "income" && t.dateOnly === dateStr)
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    return { day: dayName, amount: dayTotal };
  });

  const totalWeeklySales = weeklyData.reduce((acc, curr) => acc + curr.amount, 0);

  const cards = [
    {
      title: "Today's Sales",
      value: `৳ ${todaysSales}`,
      color: "from-emerald-600 to-teal-700",
      icon: DollarSign,
      glow: "shadow-emerald-500/10",
    },
    {
      title: "Orders",
      value: todaysOrders.toString(),
      color: "from-blue-600 to-indigo-700",
      icon: ShoppingCart,
      glow: "shadow-blue-500/10",
    },
    {
      title: "Profit",
      value: `৳ ${Math.round(todaysProfit)}`,
      color: "from-purple-600 to-pink-700",
      icon: TrendingUp,
      glow: "shadow-purple-500/10",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#F0F5F2] via-[#F5F8F6] to-[#EBEFEA] min-h-screen p-4 sm:p-8 font-sans antialiased">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#184E2E]">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm sm:text-base">
            Welcome back, here is your business summary 👋
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              onClick={() => navigate("/dashboard")}
              className={`bg-white/80 backdrop-blur-xl rounded-[24px] p-5 shadow-lg ${item.glow} cursor-pointer hover:shadow-xl hover:-translate-y-1 border border-emerald-100/60 transition-all duration-300 group`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider group-hover:text-[#184E2E] transition-colors">
                    {item.title}
                  </p>
                  <h2 className="text-3xl font-black mt-2 text-gray-800 tracking-tight">
                    {item.value}
                  </h2>
                </div>
                <div
                  className={`bg-gradient-to-br ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-900/10 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 bg-gradient-to-r from-[#116432] via-[#167840] to-[#125c30] rounded-[28px] p-6 shadow-xl text-white relative overflow-hidden flex flex-col sm:flex-row items-center justify-between border border-emerald-500/30">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="z-10 mb-4 sm:mb-0 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase text-emerald-100 mb-2 shadow-sm">
            <Flame size={14} className="text-amber-300 fill-amber-300 animate-pulse" />
            Best Product Today
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {bestProductTitle}
          </h2>
          <p className="text-emerald-100/90 text-sm font-medium mt-1">
            Over <span className="text-amber-300 font-bold underline decoration-amber-300/60">{maxQtyToday} Units</span> served to satisfied customers today!
          </p>
        </div>

        <div className="z-10 shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/95 p-2 shadow-2xl flex items-center justify-center border-4 border-emerald-400/40 overflow-hidden transform hover:scale-105 transition-transform duration-300">
            {bestProductImage ? (
              <img src={bestProductImage} alt={bestProductTitle} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-[#125c30] font-black text-2xl">
                {bestProductTitle !== "None" ? bestProductTitle.charAt(0).toUpperCase() : "⭐"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 bg-white/80 backdrop-blur-xl rounded-[24px] p-5 shadow-lg border border-emerald-100/60 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-rose-50 rounded-xl text-rose-500">
            <AlertTriangle size={16} />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Low Stock Alerts</h4>
        </div>
        {lowStockItems.length === 0 ? (
          <p className="text-xs text-emerald-600 font-semibold py-1">✨ All product stocks are in safe levels!</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-1">
            {lowStockItems.map((item) => (
              <span key={item.id} className="text-xs bg-rose-50/80 border border-rose-200/60 text-rose-600 px-3 py-1 rounded-xl font-semibold shadow-sm">
                {item.name} <span className="opacity-75">(Stock: {item.stock})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Chart এবং Top Selling Products একসাথে একটি Row-তে (Grid) রাখা হয়েছে */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 items-stretch">
        
        {/* Weekly Chart Container (Span 7) */}
        <div className="lg:col-span-7 flex justify-center w-full">
          <StyledWrapper className="w-full flex justify-center">
            <div className="theme-light w-full flex justify-center">
              <div className="card w-full max-w-none">
                <div className="bg-custom">
                  <div className="flex">
                    <p className="heading">Weekly Sales</p>
                    <p className="tag">
                      <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 925.1 925.1" xmlSpace="preserve">
                        <g>
                          <g>
                            <path d="M453.5,26.514l-345.6,187.3l15.2-3.8l412.9-104.7l-35-64.6C491.8,23.614,470.5,17.313,453.5,26.514z" />
                            <path d="M780.9,222.313l-26.2-103.4c-4-15.9-18.3-26.4-33.9-26.4c-2.8,0-5.7,0.3-8.6,1.1l-160.5,40.7l-347.4,88.1H599.4h181.5 V222.313z" />
                            <path d="M546.7,665.513v-176c0-36.699,29.8-66.5,66.5-66.5h218.6h16.5h16.5H878v-135.7c0-19.3-15.7-35-35-35h-21.5H805h-16.5 H615.7H133.8h-16.5h-16.5h-64H35c-12.9,0-24.1,7-30.2,17.3c-3,5.2-4.8,11.2-4.8,17.7v5.6v574.9c0,19.301,15.7,35,35,35h807.9 c19.3,0,35-15.699,35-35V732.114H613.2C576.5,732.114,546.7,702.214,546.7,665.513z" />
                            <path d="M908,459.513c-4.5-2.699-9.6-4.3-15-4.8c-1-0.1-1.9-0.1-2.9-0.1H878h-5.2h-16.5h-39.6H613.2c-19.3,0-35,15.7-35,35v176 c0,19.299,15.7,35,35,35H878h12.1c1,0,1.9-0.102,2.9-0.102c5.4-0.398,10.5-2.1,15-4.799c10.2-6.1,17.1-17.301,17.1-30.1v-176 C925.1,476.813,918.2,465.614,908,459.513z M700.5,634.313c-31.3,0-56.8-25.4-56.8-56.801c0-31.299,25.399-56.799,56.8-56.799 c31.3,0,56.8,25.4,56.8,56.799C757.3,608.913,731.9,634.313,700.5,634.313z" />
                          </g>
                        </g>
                      </svg>
                    </p>
                  </div>
                  <div className="amount text-green">
                    <span className="typing">৳ {totalWeeklySales}</span>
                  </div>
                  <div className="compare text-light">Last 7 days performance summary</div>
                </div>
                <div className="tags">
                  <span>Analyse Data</span>
                  <span>More</span>
                </div>
                <div className="chart">
                  {weeklyData.map((item, index) => {
                    const maxAmount = Math.max(...weeklyData.map(d => d.amount), 1);
                    const heightPercent = Math.max(Math.round((item.amount / maxAmount) * 100), 15);
                    return (
                      <div 
                        key={index} 
                        className={`bar`} 
                        style={{ height: `${heightPercent}px`, animationDelay: `${(index + 1) * 0.2}s` }}
                      >
                        <div className="pr-day">৳ {item.amount}</div>
                        <div className="bar-label">{item.day}</div>
                      </div>
                    );
                  })}
                </div>
                <button className="more-button" onClick={() => navigate("/dashboard")}>Show More</button>
              </div>
            </div>
          </StyledWrapper>
        </div>

        {/* Top Selling Products Container (Span 5) */}
        <div className="lg:col-span-5 bg-white/85 backdrop-blur-xl rounded-[24px] p-6 shadow-xl border border-emerald-100/60 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-gray-800 mb-4 pb-3 border-b border-gray-100/80 tracking-tight">
              Top Selling Products
            </h3>
            {topSellingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={36} className="mb-2 opacity-40" />
                <p className="text-xs font-medium">No sales data available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topSellingList.map(([name, qty], idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50/80 hover:bg-emerald-50/40 border border-gray-100/80 p-3.5 rounded-2xl transition-all duration-200">
                    <span className="text-xs sm:text-sm font-bold text-gray-700 truncate max-w-[200px]">{name}</span>
                    <span className="text-xs bg-emerald-100/80 text-emerald-800 px-3 py-1 rounded-full font-black shadow-sm">
                      {qty} Sold
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => navigate("/dashboard")} 
            className="w-full mt-4 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 active:scale-95"
          >
            View All Products
          </button>
        </div>

      </div>
    </div>
  );
}

const StyledWrapper = styled.div`
  .theme-light {
    --color-dark-subtle: linear-gradient(to right, #532222, #020202);
    --color-dark: #000000;
    --color-light: #fff7f7;
    --color-white: #ffffff;
    --color-red: #ff7a85d2;
    --color-red-light: #ffa7a7;
    --color-shadow-dark: rgb(31, 53, 31);
    --color-shadow-text: rgb(0 0 0 / 65%);
    --color-accent-bg: #ffa7ad4f;
    --shadow-light: -5px -5px 9px rgb(66, 48, 48);
    --shadow-dark: 5px 5px 9px rgb(128, 97, 97);
    --shadow-bar: -5px -5px 9px rgb(77 45 45 / 45%), 5px 5px 9px rgb(39 39 39);
  }

  .theme-light .card {
    border-radius: 20px;
    padding: 14px;
    width: 100%;
    background: var(--color-dark);
    position: relative;
    transition-duration: 0.2s;
    user-select: none;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }

  .card:before,
  .card:after {
    content: "";
    position: absolute;
    left: 0px;
    top: 0px;
    border-radius: 20px;
    background: linear-gradient(
      45deg,
      #fa0a0a,
      #eb021d,
      #f17917,
      #e763dc,
      #b96565,
      #e0d18b,
      #df6a0b,
      #956df3,
      #b15a65,
      #f5d103
    );
    background-size: 400%;
    width: calc(100% + 0px);
    height: calc(100% + 0px);
    z-index: -1;
    animation: steam 40s linear infinite;
  }

  @keyframes steam {
    0% {
      background-position: 0 0;
    }

    50% {
      background-position: 400% 0;
    }

    100% {
      background-position: 0 0;
    }
  }

  .card:after {
    filter: blur(20px);
  }

  .theme-light .flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .theme-light .bar-label {
    text-shadow: 1px 1px 3px var(--color-shadow-text);
    font-size: 11px;
  }

  .theme-light .flex .tag {
    fill: var(--color-white);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 25px;
    width: 25px;
    box-shadow: 4px 4px 3px var(--color-shadow-dark);
  }

  .theme-light .bg-custom {
    background: var(--color-dark-subtle);
    padding: 16px;
    margin-bottom: 10px;
    border-radius: 12px;
    box-shadow:
      inset var(--shadow-light),
      inset var(--shadow-dark);
  }

  .theme-light .pr-day {
    position: absolute;
    top: -22px;
    font-size: 9px;
    font-weight: 700;
    color: var(--color-white);
    white-space: nowrap;
  }

  .theme-light .text-light {
    color: var(--color-light);
  }

  .theme-light .text-green {
    color: var(--color-white);
  }

  .theme-light .card .heading {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-light);
    text-shadow: 4px 4px 3px var(--color-shadow-dark);
  }

  .theme-light .amount {
    font-size: 24px;
    font-weight: bold;
    margin: 6px 0;
    line-height: 1.2;
    text-shadow: 4px 4px 3px var(--color-shadow-dark);
    display: inline-flex;
    align-items: center;
  }

  .theme-light .typing {
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
  }

  .theme-light .compare {
    font-size: 11px;
    text-shadow: 4px 4px 3px var(--color-shadow-dark);
    letter-spacing: 0.5px;
  }

  .theme-light .chart {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    width: 100%;
    height: 130px;
    padding: 8px 4px;
    border-radius: 12px;
  }

  .theme-light .bar {
    width: 18px;
    font-size: 14px;
    background: var(--color-red);
    color: var(--color-dark);
    border-radius: 4px 4px 0 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    position: relative;
    transform: scaleY(0);
    transform-origin: bottom;
    animation: rippleBounce 7.5s ease-in-out infinite;
    box-shadow: var(--shadow-bar);
  }

  @keyframes rippleBounce {
    0%,
    100% {
      transform: scaleY(0.6);
    }

    25% {
      transform: scaleY(1.1);
    }

    50% {
      transform: scaleY(0.8);
    }

    75% {
      transform: scaleY(1.2);
    }
  }

  .theme-light .bar:nth-child(odd) {
    background: var(--color-white);
  }

  .theme-light .card .more-button {
    font-size: 15px;
    padding: 11px;
    border-radius: 10px;
    color: var(--color-dark);
    border: 0;
    width: 100%;
    margin-top: 10px;
    outline: none;
    background-color: var(--color-white);
    box-shadow: var(--shadow-bar);
    transition: ease all 0.3s;
    cursor: pointer;
    font-weight: bold;
  }

  .theme-light .card .more-button:hover {
    transform: translateY(-2px);
  }

  .theme-light .card .more-button:active {
    transform: scale(0.95);
  }

  .theme-light .tags {
    display: flex;
    margin-bottom: 6px;
    justify-content: end;
    color: var(--color-light);
    font-size: 11px;
    font-weight: 500;
    gap: 4px;
    text-shadow: 2px 3px 3px var(--color-shadow-dark);
  }

  .theme-light .tags span {
    padding: 2px 8px;
    background-color: #4d2c2c73;
    border-radius: 3px;
  }
`;