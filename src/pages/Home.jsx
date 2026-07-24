import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Coffee,
  TriangleAlert,
  Sparkles,
  Flame,
  ArrowUpRight,
} from "lucide-react";

export default function Home() {
  const summary = [
    {
      title: "Today's Sales",
      value: "৳ 8,450",
      color: "from-emerald-500 to-green-600",
      icon: DollarSign,
      trend: "+12% from yesterday",
    },
    {
      title: "Today's Orders",
      value: "126",
      color: "from-blue-500 to-indigo-600",
      icon: ShoppingCart,
      trend: "+8 new orders",
    },
    {
      title: "Products",
      value: "48",
      color: "from-amber-500 to-orange-600",
      icon: Package,
      trend: "4 categories active",
    },
    {
      title: "Today's Profit",
      value: "৳ 2,180",
      color: "from-purple-500 to-violet-600",
      icon: TrendingUp,
      trend: "+18% profit margin",
    },
  ];

  const weeklyData = [
    { day: "Mon", sales: 45 },
    { day: "Tue", sales: 70 },
    { day: "Wed", sales: 55 },
    { day: "Thu", sales: 95 },
    { day: "Fri", sales: 80 },
    { day: "Sat", sales: 110 },
    { day: "Sun", sales: 85 },
  ];

  return (
    <div className="bg-gradient-to-br from-[#EEF5F0] via-[#E2EEE5] to-[#D5E8D9] min-h-screen p-3 sm:p-5 lg:p-6 pb-20 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header / Brand Bar */}
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_50px_rgb(24,78,46,0.15)] hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#184E2E] to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#018837] tracking-tight">
                Dashboard
              </h1>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summary.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(24,78,46,0.15)] hover:-translate-y-1.5 hover:bg-white/95 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs font-semibold tracking-wide uppercase">
                      {item.title}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-[#184E2E] transition-colors duration-300">
                      {item.value}
                    </h2>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {item.trend}
                    </p>
                  </div>
                  <div
                    className={`bg-gradient-to-br ${item.color} w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md shadow-black/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                  >
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Selling Banner */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B5D2A] via-[#107034] to-emerald-600 p-6 sm:p-7 text-white shadow-[0_15px_40px_rgb(11,93,42,0.2)] border border-white/20 transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_25px_60px_rgb(11,93,42,0.35)]">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center lg:text-left space-y-2.5">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold border border-white/20 tracking-wide uppercase shadow-sm">
                <Flame size={14} className="text-amber-300" /> Best Product Today
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                Milk Tea
              </h2>
              <p className="text-green-100 text-sm sm:text-base font-medium">
                Over <span className="text-white font-bold underline decoration-red-600 decoration-2">82 Cups</span> served to satisfied customers today!
              </p>
            </div>
            <div className="relative group-hover:rotate-3 transition-transform duration-500">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-95 group-hover:scale-110 transition-transform duration-500"></div>
              <img
                src="https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600"
                alt="Milk Tea"
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover border-[6px] border-white/30 shadow-xl relative z-10 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* Low Stock Section with Small Images */}
        <div className="group bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(24,78,46,0.12)] hover:-translate-y-1 transition-all duration-500">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-[#184E2E]">
              Low Stock Alerts
            </h2>
            <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-full border border-red-100">Requires Attention</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Fresh Milk", stock: 3, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200" },
              { name: "Sugar", stock: 5, image: "https://images.unsplash.com/photo-1581441363689-1f3c3c552635?w=200" },
              { name: "Cake", stock: 2, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200" },
              { name: "Toast Biscuit", stock: 4, image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=200" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/80 border border-red-100/80 rounded-2xl shadow-sm hover:border-red-300 hover:shadow-md hover:scale-[1.02] transition-all duration-300 group/stock"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover/stock:scale-105 transition-transform duration-300 border border-red-100"
                  />
                  <div>
                    <span className="font-bold text-gray-800 text-xs block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5">
                      <TriangleAlert size={11} /> Low Inventory
                    </span>
                  </div>
                </div>
                <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm">
                  {item.stock} Left
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Chart + Top Selling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weekly Sales - Redesigned Modern Smooth Curve & Area Progress Style */}
          <div className="group lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(24,78,46,0.12)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-[#184E2E]">
                  Weekly Sales Performance
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Daily revenue trend overview</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/80 shadow-sm text-xs font-bold">
                <ArrowUpRight size={15} />
                <span>+14.2% Growth</span>
              </div>
            </div>

            {/* Redesigned Area Chart / Progress Line representation */}
            <div className="space-y-3.5 my-auto py-2">
              {weeklyData.map((item, index) => {
                const maxSales = 120;
                const percentage = Math.round((item.sales / maxSales) * 100);
                return (
                  <div key={index} className="group/row space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-700 group-hover/row:text-[#184E2E] transition-colors">{item.day}</span>
                      <span className="text-emerald-800 font-extrabold">৳ {item.sales * 100}</span>
                    </div>
                    <div className="w-full h-3.5 bg-emerald-50/80 rounded-full p-0.5 border border-emerald-100/50 overflow-hidden relative shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[#0B5D2A] via-emerald-600 to-emerald-400 rounded-full group-hover/row:brightness-110 transition-all duration-700 relative"
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/40 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-gray-500 font-medium">
              <span>Peak day: <strong className="text-[#184E2E]">Saturday (৳ 11,000)</strong></span>
              <span>Average: <strong className="text-[#184E2E]">৳ 7,850 / day</strong></span>
            </div>
          </div>

          {/* Top Selling */}
          <div className="group bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(24,78,46,0.12)] hover:-translate-y-1 transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-[#184E2E]">
                🔥 Top Selling
              </h2>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rankings</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: "Milk Tea",
                  sold: 82,
                  image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300",
                },
                {
                  name: "Coffee",
                  sold: 61,
                  image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300",
                },
                {
                  name: "Cake",
                  sold: 48,
                  image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
                },
                {
                  name: "Black Tea",
                  sold: 41,
                  image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300",
                },
                {
                  name: "Green Tea",
                  sold: 35,
                  image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300",
                },
                {
                  name: "Lemon Tea",
                  sold: 29,
                  image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/50 border border-transparent hover:border-emerald-200 hover:bg-white hover:shadow-sm hover:scale-[1.02] transition-all duration-300 group/item"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover/item:scale-105 transition-transform duration-300"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm group-hover/item:text-[#184E2E] transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-gray-500 text-[11px] font-medium">
                        {item.sold} Units Sold
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-300 shadow-sm">
                    <Coffee size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}