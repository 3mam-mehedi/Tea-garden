import { NavLink } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { SiHomeassistantcommunitystore, SiCoffeescript } from "react-icons/si";
import { AiOutlineDashboard } from "react-icons/ai";
import { MdOutlineProductionQuantityLimits } from "react-icons/md";
import { GiBookmark } from "react-icons/gi";
import { BsCalculatorFill } from "react-icons/bs";
import { useState, useEffect } from "react";

const menus = [
  { title: "Homepage", path: "/", icon: SiHomeassistantcommunitystore },
  { title: "Dashboard", path: "/dashboard", icon: AiOutlineDashboard },
  { title: "Products", path: "/products", icon: MdOutlineProductionQuantityLimits },
  { title: "Tali", path: "/tali", icon: GiBookmark },
  { title: "Calculator", path: "/calculator", icon: BsCalculatorFill },
];

export default function Navbar() {
  const [collapse, setCollapse] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // স্ক্রিন সাইজ চেক এবং মোবাইল মেনু ওপেন থাকলে বডি স্ক্রল বন্ধ রাখার জন্য
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Button (Right Side Glassmorphism & Smooth Animation) */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-40 backdrop-blur-md bg-white/75 border border-white/80 text-[#0A5D2D] p-2.5 rounded-2xl shadow-xl transition-all duration-300 active:scale-95"
      >
        <div className="relative w-[22px] h-[22px] flex items-center justify-center">
          <Menu 
            size={22} 
            className={`absolute transition-all duration-300 transform ${mobileOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`} 
          />
          <X 
            size={22} 
            className={`absolute transition-all duration-300 transform ${mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"}`} 
          />
        </div>
      </button>

      {/* Overlay with Smooth Fade Animation */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`
          fixed top-0 left-0 h-screen z-50
          bg-[#0B5D2A] text-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${collapse ? "w-[80px]" : "w-[230px]"}
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#16803d]/40"></div>
          <div className="absolute top-44 -right-20 w-72 h-72 bg-[#0F6D34]" style={{ clipPath: "polygon(0 0,100% 50%,0 100%)" }} />
          <div className="absolute bottom-0 left-0 w-full h-56 bg-[#084821]" style={{ clipPath: "polygon(0 35%,100% 0,100% 100%,0 100%)" }} />
        </div>

        {/* Top */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="px-4 pt-6 pb-4 flex items-center justify-between">
            {(!collapse || isMobile) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
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
              className="hidden lg:flex bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors mx-auto lg:mx-0"
              title={collapse ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapse ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
                    } ${collapse && !isMobile ? "justify-center px-0" : ""}`
                  }
                  title={collapse && !isMobile ? item.title : ""}
                >
                  <Icon size={20} className="shrink-0" />
                  {(!collapse || isMobile) && <span className="text-sm">{item.title}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 px-3 mb-12 lg:mb-4">
          <div className={`rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3 flex items-center ${collapse && !isMobile ? "justify-center p-2" : "gap-3"}`}>
            <div className="relative shrink-0">
              <img 
                src="/assets/logo/tea.jpg" 
                alt="profile" 
                className={`rounded-full object-cover border-2 border-white/85 shadow-lg ${collapse && !isMobile ? "w-9 h-9" : "w-10 h-10"}`} 
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B5D2A] rounded-full"></span>
            </div>
            {(!collapse || isMobile) && (
              <div className="flex-1 overflow-hidden">
                <h4 className="font-semibold text-sm truncate">চা বাগান</h4>
                <p className="text-[10px] text-white/70">Administrator</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}