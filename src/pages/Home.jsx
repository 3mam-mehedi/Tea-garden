
import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Package,
  Flame,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import styled from "styled-components";

import { db } from "../firebase";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";

// ===============================
// CUSTOM CHART TOOLTIP
// ===============================

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2.5 sm:p-3 rounded-2xl text-xs bg-white/80 backdrop-blur-md shadow-xl border border-white/40">
        <p className="font-bold text-slate-700 mb-1">
          {label}
        </p>

        <p className="text-blue-600 font-semibold">
          চলতি সপ্তাহ: ৳
          {(payload[0]?.value || 0).toLocaleString()}
        </p>

        <p className="text-emerald-600 font-semibold">
          গত সপ্তাহ: ৳
          {(payload[1]?.value || 0).toLocaleString()}
        </p>
      </div>
    );
  }

  return null;
};

// ===============================
// DATE HELPERS
// ===============================

// Dhaka timezone অনুযায়ী তারিখ ও সময় বের করা
const getDhakaDateTime = (dateObj) => {
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(dateObj);

  const get = (type) =>
    parts.find((part) => part.type === type)?.value;

  return {
    dateOnly: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
};

// Transaction-এর তারিখ ও সময় বের করা
const getTransactionDateTime = (transaction) => {
  // নতুন transaction: Firestore server timestamp
  if (transaction.createdAt?.toDate) {
    return getDhakaDateTime(transaction.createdAt.toDate());
  }

  if (transaction.createdAt instanceof Date) {
    return getDhakaDateTime(transaction.createdAt);
  }

  // পুরোনো transaction: date এবং dateOnly
  const dateString = String(transaction.date || "");

  const timeMatch = dateString.match(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i
  );

  if (!timeMatch) return null;

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] || 0);
  const meridiem = timeMatch[4]?.toUpperCase();

  if (meridiem === "PM" && hour !== 12) {
    hour += 12;
  }

  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  let dateOnly = transaction.dateOnly || "";

  if (!dateOnly) {
    const datePart = dateString.split(" at ")[0];
    const parsed = new Date(datePart);

    if (!Number.isNaN(parsed.getTime())) {
      dateOnly = getDhakaDateTime(parsed)?.dateOnly || "";
    }
  }

  if (!dateOnly) return null;

  return {
    dateOnly,
    hour,
    minute,
    second,
  };
};

// ব্যবসার সময়: বিকেল ৩টা থেকে সন্ধ্যা ৭টা
// ৩:০০ PM অন্তর্ভুক্ত, ৭:০০ PM অন্তর্ভুক্ত নয়
const isBusinessHours = (dateTime) => {
  if (!dateTime) return false;

  const totalMinutes =
    dateTime.hour * 60 + dateTime.minute;

  return (
    totalMinutes >= 15 * 60 &&
    totalMinutes < 19 * 60
  );
};

// Dhaka অনুযায়ী আজকের তারিখ
const getTodayDhaka = () => {
  return getDhakaDateTime(new Date())?.dateOnly || "";
};

// Date string-এ দিন যোগ বা বিয়োগ
const addDays = (dateString, amount) => {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day + amount)
  );

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

// ===============================
// MAIN HOME COMPONENT
// ===============================

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);

  const [transactionsLoading, setTransactionsLoading] =
    useState(true);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [firebaseError, setFirebaseError] = useState(false);

  // ===============================
  // FIREBASE REALTIME DATA
  // ===============================

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productList = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setProducts(productList);
        setProductsLoading(false);
      },
      (error) => {
        console.error("Products Firebase Error:", error);
        setProductsLoading(false);
        setFirebaseError(true);
      }
    );

    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const transactionList = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setTransactions(transactionList);
        setTransactionsLoading(false);
      },
      (error) => {
        console.error("Transactions Firebase Error:", error);
        setTransactionsLoading(false);
        setFirebaseError(true);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeTransactions();
    };
  }, []);

  // ===============================
  // TODAY
  // ===============================

  const todayStr = getTodayDhaka();

  // ===============================
  // FLATTEN TRANSACTIONS
  // ===============================

  const flattenedTransactions = useMemo(() => {
    const flattened = [];

    transactions.forEach((t) => {
      if (!t) return;

      const dateTime = getTransactionDateTime(t);
      const businessHours = isBusinessHours(dateTime);

      if (t.isOrderGroup && Array.isArray(t.items)) {
        t.items.forEach((item) => {
          flattened.push({
            title: item.name,
            productId: item.productId || "",
            amount:
              Number(item.price || 0) *
              Number(item.qty || 1),
            quantity: Number(item.qty || 1),
            type: t.type || "income",
            dateOnly: dateTime?.dateOnly || "",
            date: t.date,
            businessHours,
          });
        });
      } else if (t.title) {
        flattened.push({
          ...t,
          title: t.title,
          quantity: Number(t.quantity || 1),
          dateOnly: dateTime?.dateOnly || "",
          businessHours,
        });
      }
    });

    return flattened;
  }, [transactions]);

  // ===============================
  // TODAY'S BEST PRODUCT
  // শুধু বিকেল ৩টা - সন্ধ্যা ৭টা
  // ===============================

  const todayItemCounts = useMemo(() => {
    const counts = {};

    flattenedTransactions
      .filter(
        (t) =>
          t.type === "income" &&
          t.dateOnly === todayStr &&
          t.businessHours &&
          t.title
      )
      .forEach((t) => {
        const qty = Number(t.quantity || 1);

        counts[t.title] = (counts[t.title] || 0) + qty;
      });

    return counts;
  }, [flattenedTransactions, todayStr]);

  const bestProductEntry = Object.entries(todayItemCounts)
    .sort((a, b) => b[1] - a[1])[0];

  const bestProductTitle = bestProductEntry
    ? bestProductEntry[0]
    : "None";

  const maxQtyToday = bestProductEntry
    ? bestProductEntry[1]
    : 0;

  const matchedBestProductObj = products.find(
    (p) =>
      p.name &&
      bestProductTitle !== "None" &&
      p.name.toLowerCase() === bestProductTitle.toLowerCase()
  );

  const bestProductImage =
    matchedBestProductObj?.image ||
    matchedBestProductObj?.img ||
    null;

  // ===============================
  // LOW STOCK PRODUCTS
  // ===============================

  const lowStockItems = useMemo(() => {
    return products.filter(
      (p) =>
        !p.isUnlimited &&
        (Number(p.stock) || 0) <= 5
    );
  }, [products]);

  // ===============================
  // TOP SELLING PRODUCTS
  // শুধু বিকেল ৩টা - সন্ধ্যা ৭টা
  // ===============================

  const topSellingList = useMemo(() => {
    const counts = {};

    flattenedTransactions
      .filter(
        (t) =>
          t.type === "income" &&
          t.businessHours &&
          t.title
      )
      .forEach((t) => {
        const qty = Number(t.quantity || 1);

        counts[t.title] = (counts[t.title] || 0) + qty;
      });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [flattenedTransactions]);

  // ===============================
  // WEEKLY SALES CHART
  // বর্তমান ৭ দিন বনাম আগের ৭ দিন
  // শুধু বিকেল ৩টা - সন্ধ্যা ৭টা
  // ===============================

  const dayNamesBangla = {
    Sun: "রবি",
    Mon: "সোম",
    Tue: "মঙ্গল",
    Wed: "বুধ",
    Thu: "বৃহস্পতি",
    Fri: "শুক্র",
    Sat: "শনি",
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDays(todayStr, -(6 - i));

    const [year, month, day] = dateStr
      .split("-")
      .map(Number);

    const d = new Date(
      Date.UTC(year, month - 1, day)
    );

    const enDay = d.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });

    return {
      dateStr,
      dayName: dayNamesBangla[enDay] || enDay,
    };
  });

  const weeklyData = last7Days.map(
    ({ dateStr, dayName }, index) => {
      const currentDayTotal = transactions
        .filter((t) => {
          if (!t || t.type !== "income") return false;

          const dateTime = getTransactionDateTime(t);

          return (
            dateTime?.dateOnly === dateStr &&
            isBusinessHours(dateTime)
          );
        })
        .reduce(
          (acc, t) => acc + Number(t.amount || 0),
          0
        );

      const prevDateStr = addDays(dateStr, -7);

      const prevDayTotal = transactions
        .filter((t) => {
          if (!t || t.type !== "income") return false;

          const dateTime = getTransactionDateTime(t);

          return (
            dateTime?.dateOnly === prevDateStr &&
            isBusinessHours(dateTime)
          );
        })
        .reduce(
          (acc, t) => acc + Number(t.amount || 0),
          0
        );

      return {
        day: dayName,
        currentWeek: currentDayTotal,
        previousWeek: prevDayTotal,
      };
    }
  );

  const totalWeeklySales = weeklyData.reduce(
    (acc, curr) => acc + curr.currentWeek,
    0
  );

  const totalPrevWeeklySales = weeklyData.reduce(
    (acc, curr) => acc + curr.previousWeek,
    0
  );

  const isLoading =
    transactionsLoading || productsLoading;

  // ===============================
  // UI
  // আগের UI অপরিবর্তিত
  // ===============================

  return (
    <StyledWrapper>
      <div className="p-3 sm:p-6 font-sans antialiased pb-20">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-2">
          {isLoading && (
            <span className="text-xs text-emerald-700 font-semibold">
              Loading Firebase Data...
            </span>
          )}
        </div>

        {/* FIREBASE ERROR */}

        {firebaseError && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
            Firebase থেকে ডেটা লোড করতে সমস্যা হচ্ছে।
            Internet connection এবং Firestore Rules চেক করো।
          </div>
        )}

        {/* BEST PRODUCT */}

        <div className="mt-4 sm:mt-5 bg-blue-600/25 hover:bg-blue-600/15 border-blue-600/30 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between border gap-4">
          <div className="z-10 text-center sm:text-left w-full sm:w-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-blue-600/20 text-[11px] sm:text-xs font-bold tracking-wide uppercase text-black mb-2">
              <Flame
                size={18}
                className="text-amber-400 fill-amber-500 animate-pulse"
              />
              Best Product Today
            </div>

            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-blue-600 truncate max-w-full sm:max-w-md">
              {bestProductTitle}
            </h2>

            <p className="text-black text-xs sm:text-sm font-medium mt-1">
              Over{" "}
              <span className="text-rose-600 font-bold underline decoration-rose-600/60">
                {maxQtyToday} Units
              </span>{" "}
              served to satisfied customers today!
            </p>
          </div>

          <div className="z-10 shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white/10 p-1.5 sm:p-2 shadow-inner flex items-center justify-center border-2 border-white/30 overflow-hidden transform hover:scale-105 transition-transform duration-300">
              {bestProductImage ? (
                <img
                  src={bestProductImage}
                  alt={bestProductTitle}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white font-black text-xl sm:text-2xl">
                  {bestProductTitle !== "None"
                    ? bestProductTitle.charAt(0).toUpperCase()
                    : "🛍️"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* LOW STOCK */}

        <div className="mt-4 sm:mt-5 bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 sm:p-1.5 bg-rose-500/10 rounded-lg sm:rounded-xl text-rose-500">
              <AlertTriangle size={15} />
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Low Stock Alerts
            </h4>
          </div>

          {lowStockItems.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold py-1">
              All product stocks are in safe levels!
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-24 overflow-y-auto pr-1">
              {lowStockItems.map((item) => (
                <span
                  key={item.id}
                  className="text-[11px] sm:text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 px-2.5 py-1 rounded-xl font-semibold shadow-sm backdrop-blur-sm"
                >
                  {item.name}{" "}
                  <span className="opacity-75">
                    (Stock: {item.stock})
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* WEEKLY CHART + TOP SELLING */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mt-4 sm:mt-5 items-stretch">

          {/* WEEKLY CHART */}

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

                {/* LEGEND */}

                <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-600 inline-block" />
                    <span className="text-slate-600">
                      চলতি সপ্তাহ
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-slate-600">
                      গত সপ্তাহ
                    </span>
                  </div>
                </div>
              </div>

              {/* CHART */}

              <div className="h-56 sm:h-72 w-full bg-white/40 rounded-xl sm:rounded-2xl p-1 sm:p-4 border border-slate-200/50">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weeklyData}
                    margin={{
                      top: 10,
                      right: 5,
                      left: -25,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="colorCurrent"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      <linearGradient
                        id="colorPrevious"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(203, 213, 225, 0.4)"
                    />

                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                      tickFormatter={(value) =>
                        `৳${
                          value >= 1000
                            ? value / 1000 + "K"
                            : value
                        }`
                      }
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Area
                      type="monotone"
                      dataKey="currentWeek"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCurrent)"
                      dot={{
                        r: 3,
                        fill: "#2563eb",
                        strokeWidth: 2,
                        stroke: "#ffffff",
                      }}
                      activeDot={{
                        r: 5,
                        stroke: "#2563eb",
                        strokeWidth: 2,
                        fill: "#ffffff",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="previousWeek"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPrevious)"
                      dot={{
                        r: 3,
                        fill: "#10b981",
                        strokeWidth: 2,
                        stroke: "#ffffff",
                      }}
                      activeDot={{
                        r: 5,
                        stroke: "#10b981",
                        strokeWidth: 2,
                        fill: "#ffffff",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* WEEKLY TOTALS */}

            <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-500 gap-2">
              <span>সর্বশেষ আপডেট: এইমাত্র</span>

              <div className="bg-white/60 border border-slate-200/60 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center shadow-sm">
                <span className="font-medium text-slate-700">
                  চলতি:{" "}
                  <strong className="text-blue-600">
                    ৳{totalWeeklySales}
                  </strong>
                </span>

                <span className="text-slate-300">|</span>

                <span className="font-medium text-slate-700">
                  গত সপ্তাহ:{" "}
                  <strong className="text-emerald-500">
                    ৳{totalPrevWeeklySales}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* TOP SELLING PRODUCTS */}

          <div className="lg:col-span-5 bg-white/70 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-lg text-slate-800 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-200/50 tracking-tight">
                Top Selling Products
              </h3>

              {topSellingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-slate-400">
                  <Package size={32} className="mb-2 opacity-40" />

                  <p className="text-xs font-medium">
                    No sales data available yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {topSellingList.map(([name, qty], idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white/50 hover:bg-white/90 border border-slate-200/60 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-sm"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-700 truncate max-w-[180px] sm:max-w-[200px]">
                        {name}
                      </span>

                      <span className="text-[11px] sm:text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-black shadow-sm shrink-0">
                        {qty} Sold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div``;
