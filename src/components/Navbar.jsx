import { NavLink } from "react-router-dom";
import {
  Receipt,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { SiHomeassistantcommunitystore ,SiCoffeescript} from "react-icons/si";
import { AiOutlineDashboard } from "react-icons/ai";
import { MdOutlineProductionQuantityLimits } from "react-icons/md";
import { GiBookmark,GiCoffeeCup} from "react-icons/gi";
import { BsCalculatorFill } from "react-icons/bs";
import { useState, useEffect } from "react";

const menus = [
  { title: "Homepage", path: "/", icon: SiHomeassistantcommunitystore },
  { title: "Dashboard", path: "/dashboard", icon: AiOutlineDashboard },
  { title: "Products", path: "/products", icon: MdOutlineProductionQuantityLimits },
  { title: "Tali", path: "/tali", icon: GiBookmark },
  { title: "Expenses", path: "/expenses", icon: Receipt },
  { title: "Reports", path: "/reports", icon: ChartColumn },
  { title: "Calculator", path: "/calculator", icon: BsCalculatorFill },
];

export default function Navbar() {
  const [collapse, setCollapse] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // স্ক্রিন সাইজ চেক করার জন্য
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-5 left-5 z-40 bg-[#0A5D2D] text-white p-2 rounded-xl shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen z-50
          bg-[#0B5D2A] text-white flex flex-col justify-between overflow-hidden transition-all duration-300
          ${collapse ? "w-[80px]" : "w-[230px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Background Decorations (অপরিবর্তিত) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#16803d]/40"></div>
          <div className="absolute top-44 -right-20 w-72 h-72 bg-[#0F6D34]" style={{ clipPath: "polygon(0 0,100% 50%,0 100%)" }} />
          <div className="absolute bottom-0 left-0 w-full h-56 bg-[#084821]" style={{ clipPath: "polygon(0 35%,100% 0,100% 100%,0 100%)" }} />
        </div>

        {/* Top */}
        <div className="relative z-10">
          <div className="px-4 pt-6 pb-4 flex items-center justify-between">
            {(!collapse || isMobile) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <SiCoffeescript className="text-[#0A5D2D]" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Tea Garden</h2>
                  <p className="text-[10px] text-white/70">Tea Management</p>
                </div>
              </div>
            )}

            <button
              onClick={() => isMobile ? setMobileOpen(false) : setCollapse(!collapse)}
              className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              {isMobile ? <X size={18} /> : collapse ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive ? "bg-white text-[#0B5D2A] shadow-lg font-semibold" : "hover:bg-white/10"
                    }`
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  {(!collapse || isMobile) && <span className="text-sm">{item.title}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 px-3 pb-4">
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3">
            <div className="flex items-center gap-3">
              <img src="/assets/logo/tea.jpg" alt="profile" className="w-10 h-10 rounded-full object-cover" />
              {(!collapse || isMobile) && (
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-sm truncate">Tea Garden</h4>
                  <p className="text-xs text-white/70">Administrator</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}