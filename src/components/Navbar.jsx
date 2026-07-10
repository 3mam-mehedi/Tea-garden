import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  ChartColumn,
  Calculator as CalculatorIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Coffee,
} from "lucide-react";
import { useState } from "react";

const menus = [
  { title: "Homepage", path: "/", icon: LayoutDashboard },
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Products", path: "/products", icon: Package },
  { title: "Sales", path: "/sales", icon: ShoppingCart },
  { title: "Expenses", path: "/expenses", icon: Receipt },
  { title: "Reports", path: "/reports", icon: ChartColumn },
  { title: "Calculator", path: "/calculator", icon: CalculatorIcon },
];

export default function Navbar() {
  const [collapse, setCollapse] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-5 left-5 z-50 bg-[#0A5D2D] text-white p-3 rounded-xl"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
    fixed lg:fixed
    top-0 left-0
    h-screen
    ${collapse ? "w-[80px]" : "w-[230px]"}
    ${mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }
    transition-all duration-300
    bg-[#0B5D2A]
    text-white
    flex flex-col
    justify-between
    overflow-hidden
    z-50
  `}
      >
        {/* Background */}
        <div className="absolute inset-0">

          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#16803d]/40"></div>

          <div
            className="absolute top-44 -right-20 w-72 h-72 bg-[#0F6D34]"
            style={{
              clipPath: "polygon(0 0,100% 50%,0 100%)",
            }}
          />

          <div
            className="absolute bottom-0 left-0 w-full h-56 bg-[#084821]"
            style={{
              clipPath:
                "polygon(0 35%,100% 0,100% 100%,0 100%)",
            }}
          />

          <div className="absolute top-10 right-6 grid grid-cols-6 gap-2 opacity-20">
            {Array.from({ length: 36 }).map((_, i) => (
              <span
                key={i}
                className="w-[3px] h-[3px] rounded-full bg-white"
              />
            ))}
          </div>
        </div>

        {/* Top */}
        <div className="relative z-10">

          {/* Logo */}
          <div className="px-4 pt-6 pb-4 flex items-center justify-between">

            {!collapse && (
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                  <Coffee className="text-[#0A5D2D]" size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-xl">
                    TeaPoint
                  </h2>

                  <p className="text-xs text-white/70">
                    Tea Management
                  </p>
                </div>

              </div>
            )}

            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(false);
                } else {
                  setCollapse(!collapse);
                }
              }}
              className="bg-white/10 p-2 rounded-xl hover:bg-white/20"
            >
              {window.innerWidth < 1024 ? (
                <X size={18} />
              ) : collapse ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>

          </div>

          {/* Menu */}
          <div className="px-3 mt-3 space-y-1">

            {menus.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.title}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    px-4 py-3
                    rounded-xl
                    transition-all duration-300
                    ${isActive
                      ? "bg-white text-[#0B5D2A] shadow-lg font-semibold"
                      : "hover:bg-white/10"
                    }
                    `
                  }
                >
                  <Icon size={20} />

                  {!collapse && (
                    <span className="text-sm">
                      {item.title}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

        </div>
        {/* Bottom Section */}
        <div className="relative z-10 px-3 pb-4">

          {/* Profile Card */}
          <div className=" rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3">

            <div className="flex items-center gap-3">

              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="profile"
                className="w-10 h-10 rounded-full object-cover"
              />

              {!collapse && (
                <>
                  <div className="flex-1">

                    <h4 className="font-semibold text-sm">
                      Tea Garden
                    </h4>

                    <p className="text-xs text-white/70">
                      Administrator
                    </p>

                  </div>

                  <ChevronRight size={16} />
                </>
              )}

            </div>

          </div>

        </div>

      </aside>
    </>
  );
}