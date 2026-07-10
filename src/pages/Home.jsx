import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Coffee,
  Cake,
  ChartColumn,
  TriangleAlert,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const summary = [
    {
      title: "Today's Sales",
      value: "৳ 8,450",
      color: "bg-green-600",
      icon: DollarSign,
    },
    {
      title: "Today's Orders",
      value: "126",
      color: "bg-blue-600",
      icon: ShoppingCart,
    },
    {
      title: "Products",
      value: "48",
      color: "bg-orange-500",
      icon: Package,
    },
    {
      title: "Today's Profit",
      value: "৳ 2,180",
      color: "bg-purple-600",
      icon: TrendingUp,
    },
  ];

  const categories = [
    {
      name: "Milk Tea",
      products: 10,
      image:
        "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=500",
    },
    {
      name: "Black Tea",
      products: 8,
      image:
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500",
    },
    {
      name: "Coffee",
      products: 12,
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
    },
    {
      name: "Bakery",
      products: 18,
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
    },
  ];

  return (
    <div className="bg-[#F4F8F5] p-8 pb-20">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-4xl font-bold text-[#184E2E]">
            Tea Garden Dashboard
          </h1>

          <p className="text-gray-500 mt-2">
            Welcome back 👋
          </p>

        </div>

        <button className="bg-[#0B5D2A] text-white px-6 py-3 rounded-2xl flex items-center gap-2">

          <Plus size={18} />

          New Sale

        </button>

      </div>

      {/* Summary */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

        {summary.map((item, index) => {

          const Icon = item.icon;

          return (

            <div
              key={index}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg duration-300"
            >

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-500">
                    {item.title}
                  </p>

                  <h2 className="text-3xl font-bold mt-3">
                    {item.value}
                  </h2>

                </div>

                <div
                  className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white`}
                >
                  <Icon size={28} />
                </div>

              </div>

            </div>

          );

        })}

      </div>

      {/* Categories */}

      <div className="mt-10">

        <div className="flex justify-between items-center mb-5">

          <h2 className="text-2xl font-bold text-[#184E2E]">
            Product Categories
          </h2>

          <button className="text-green-700 flex items-center gap-2">

            View All

            <ArrowRight size={16} />

          </button>

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

          {categories.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl duration-300"
            >

              <img
                src={item.image}
                alt={item.name}
                className="h-40 w-full object-cover"
              />

              <div className="p-5">

                <h3 className="font-bold text-xl">
                  {item.name}
                </h3>

                <p className="text-gray-500 mt-2">
                  {item.products} Products
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>
            {/* Sales Chart + Top Selling */}

      <div className="grid lg:grid-cols-3 gap-6 mt-10">

        {/* Weekly Sales */}

        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold text-[#184E2E]">
              Weekly Sales
            </h2>

            <div className="flex items-center gap-2 text-green-700">

              <ChartColumn size={20} />

              <span className="font-medium">
                Last 7 Days
              </span>

            </div>

          </div>

          <div className="flex items-end justify-between h-72">

            {[45, 70, 55, 95, 80, 110, 85].map((item, index) => (

              <div
                key={index}
                className="flex flex-col items-center gap-3 flex-1"
              >

                <div
                  className="w-9 rounded-t-2xl bg-gradient-to-t from-[#0B5D2A] to-green-400 hover:scale-105 duration-300"
                  style={{
                    height: `${item * 2}px`,
                  }}
                ></div>

                <span className="text-sm text-gray-500">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}
                </span>

              </div>

            ))}

          </div>

        </div>

        {/* Top Selling */}

        <div className="bg-white rounded-3xl p-6 shadow-sm">

          <h2 className="text-2xl font-bold text-[#184E2E] mb-6">
            🔥 Top Selling
          </h2>

          {[
            {
              name: "Milk Tea",
              sold: 82,
              image:
                "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300",
            },
            {
              name: "Coffee",
              sold: 61,
              image:
                "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300",
            },
            {
              name: "Cake",
              sold: 48,
              image:
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
            },
            {
              name: "Black Tea",
              sold: 41,
              image:
                "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300",
            },

          ].map((item, index) => (

            <div
              key={index}
              className="flex items-center justify-between py-3 border-b last:border-none"
            >

              <div className="flex items-center gap-3">

                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />

                <div>

                  <h4 className="font-semibold">
                    {item.name}
                  </h4>

                  <p className="text-gray-500 text-sm">
                    {item.sold} Sold
                  </p>

                </div>

              </div>

              <Coffee
                className="text-green-700"
                size={20}
              />

            </div>

          ))}

        </div>

      </div>

      {/* Best Selling Banner */}

      <div className="mt-10 rounded-3xl bg-gradient-to-r from-[#0B5D2A] via-green-700 to-green-500 p-8 text-white">

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

          <div>

            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">

              🔥 Best Product Today

            </span>

            <h2 className="text-5xl font-bold mt-5">

              Milk Tea

            </h2>

            <p className="mt-4 text-green-100 text-lg">

              82 Cups Sold Today

            </p>

            <button className="mt-6 bg-white text-[#0B5D2A] px-6 py-3 rounded-2xl font-semibold">

              View Details

            </button>

          </div>

          <img
            src="https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600"
            alt="Milk Tea"
            className="w-72 h-72 rounded-full object-cover border-[8px] border-white/20"
          />

        </div>

      </div>
            {/* Recent Sales + Low Stock */}

      <div className="grid lg:grid-cols-2 gap-6 mt-10">

        {/* Recent Sales */}

        <div className="bg-white rounded-3xl p-6 shadow-sm">

          <h2 className="text-2xl font-bold text-[#184E2E] mb-6">
            Recent Sales
          </h2>

          {[
            {
              customer: "Walk-in Customer",
              product: "Milk Tea",
              qty: 2,
              amount: "৳80",
              time: "10:20 AM",
            },
            {
              customer: "Rahim",
              product: "Coffee",
              qty: 1,
              amount: "৳60",
              time: "11:10 AM",
            },
            {
              customer: "Karim",
              product: "Cake",
              qty: 3,
              amount: "৳180",
              time: "11:45 AM",
            },
            {
              customer: "Walk-in Customer",
              product: "Black Tea",
              qty: 2,
              amount: "৳50",
              time: "12:10 PM",
            },

          ].map((sale, index) => (

            <div
              key={index}
              className="flex items-center justify-between py-4 border-b last:border-none"
            >

              <div>

                <h4 className="font-semibold">
                  {sale.product}
                </h4>

                <p className="text-sm text-gray-500">
                  {sale.customer} • Qty {sale.qty}
                </p>

              </div>

              <div className="text-right">

                <h4 className="font-bold text-green-700">
                  {sale.amount}
                </h4>

                <span className="text-xs text-gray-500">
                  {sale.time}
                </span>

              </div>

            </div>

          ))}

        </div>

        {/* Low Stock */}

        <div className="bg-white rounded-3xl p-6 shadow-sm">

          <h2 className="text-2xl font-bold text-[#184E2E] mb-6">
            Low Stock
          </h2>

          {[
            {
              name: "Fresh Milk",
              stock: 3,
            },
            {
              name: "Sugar",
              stock: 5,
            },
            {
              name: "Cake",
              stock: 2,
            },
            {
              name: "Toast Biscuit",
              stock: 4,
            },

          ].map((item, index) => (

            <div
              key={index}
              className="flex items-center justify-between py-4 border-b last:border-none"
            >

              <div className="flex items-center gap-3">

                <TriangleAlert
                  className="text-red-500"
                  size={20}
                />

                <span className="font-medium">
                  {item.name}
                </span>

              </div>

              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">

                {item.stock} Left

              </span>

            </div>

          ))}

        </div>

      </div>

      {/* Quick Actions */}

      <div className="mt-10">

        <h2 className="text-2xl font-bold text-[#184E2E] mb-5">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

          <button className="bg-[#0B5D2A] text-white rounded-2xl py-5 font-semibold hover:bg-green-700 transition">
            ➕ New Sale
          </button>

          <button className="bg-white rounded-2xl py-5 shadow-sm hover:shadow-lg transition">
            📦 Add Product
          </button>

          <button className="bg-white rounded-2xl py-5 shadow-sm hover:shadow-lg transition">
            💰 Add Expense
          </button>

          <button className="bg-white rounded-2xl py-5 shadow-sm hover:shadow-lg transition">
            📊 Reports
          </button>

        </div>

      </div>

    </div>
  );
}