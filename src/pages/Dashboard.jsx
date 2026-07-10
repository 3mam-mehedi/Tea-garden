import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

const cards = [
  {
    title: "Today's Sales",
    value: "৳ 8,450",
    color: "bg-green-600",
    icon: DollarSign,
  },
  {
    title: "Orders",
    value: "126",
    color: "bg-blue-600",
    icon: ShoppingCart,
  },
  {
    title: "Profit",
    value: "৳ 2,180",
    color: "bg-purple-600",
    icon: TrendingUp,
  },
  {
    title: "Customers",
    value: "58",
    color: "bg-orange-500",
    icon: Users,
  },
];

export default function Dashboard() {
  return (
    <div className="bg-[#F5F8F6] min-h-screen p-8">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-4xl font-bold text-[#184E2E]">
            Dashboard
          </h1>

          <p className="text-gray-500 mt-2">
            Welcome Back 👋
          </p>

        </div>

        <button className="bg-[#0B5D2A] text-white px-6 py-3 rounded-xl">
          + New Sale
        </button>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

        {cards.map((item, index) => {

          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-3xl p-6 shadow-sm"
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
                  <Icon />
                </div>

              </div>

            </div>
          );

        })}

      </div>

    </div>
  );
}