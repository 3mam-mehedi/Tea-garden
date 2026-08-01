import { NavLink, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
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
  const [isImageZoomed, setIsImageZoomed] = useState(false);

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
    if (mobileOpen || isImageZoomed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen, isImageZoomed]);

  const profileImageUrl = "/assets/logo/tea.png";
  const googleMapUrl = "https://www.google.com/maps/place/%E0%A6%9A%E0%A6%BE+%E0%A6%AC%E0%A6%BE%E0%A6%97%E0%A6%BE%E0%A6%6E/@23.4641434,90.2865942,19z/data=!4m14!1m7!3m6!1s0x37559f0046545ee7:0x314ab1ead61fc9f4!2z4Kaa4Ka-IOCmrOCmvuCml-CmvuCmqA!8m2!3d23.4641814!4d90.2865936!16s%2Fg%2F11zg1dg487!3m5!1s0x37559f0046545ee7:0x314ab1ead61fc9f4!8m2!3d23.4641814!4d90.2865936!16s%2Fg%2F11zg1dg487?entry=ttu&g_ep=EgoyMDI2MDcyOS4wIKXMDSoASAFQAw%3D%3D";

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
              <Link 
                to="/" 
                onClick={() => isMobile && setMobileOpen(false)}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105">
                  <SiCoffeescript className="text-[#0A5D2D]" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg group-hover:text-emerald-200 transition-colors">Tea Garden</h2>
                  <p className="text-[10px] text-white/70">Tea Management</p>
                </div>
              </Link>
            )}

            {/* When collapsed, clicking the top icon/logo can also go to home */}
            {collapse && !isMobile && (
              <Link 
                to="/" 
                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0 mx-auto hover:scale-105 transition-transform"
                title="Homepage"
              >
                <SiCoffeescript className="text-[#0A5D2D]" size={24} />
              </Link>
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
        <div className="relative z-10 px-3 mb-16 lg:mb-4">
          <div className={`rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3 flex items-center ${collapse && !isMobile ? "justify-center p-2" : "gap-3"}`}>
            <div className="relative shrink-0">
              {/* Image with Zoom Trigger on Click */}
              <img 
                src={profileImageUrl}
                alt="profile" 
                onClick={() => setIsImageZoomed(true)}
                className={`rounded-full object-cover border-2 border-white/85 shadow-lg cursor-pointer transition-transform duration-200 hover:scale-105 ${collapse && !isMobile ? "w-9 h-9" : "w-10 h-10"}`} 
                title="Click to zoom image"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B5D2A] rounded-full pointer-events-none"></span>
            </div>
            
            {/* Clickable Text to Google Map */}
            {(!collapse || isMobile) && (
              <a 
                href={googleMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 overflow-hidden group cursor-pointer text-left block"
                title="View on Google Maps"
              >
                <div className="flex items-center gap-1">
                  <h4 className="font-semibold text-sm truncate group-hover:underline text-white">চা বাগান</h4>
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-300 shrink-0" />
                </div>
                <p className="text-[10px] text-white/70 group-hover:text-white/90 transition-colors">Administrator</p>
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* Image Zoom Modal with Animation */}
      {isImageZoomed && (
        <div 
          onClick={() => setIsImageZoomed(false)}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn"
        >
          <div className="relative max-w-lg w-full flex flex-col items-center">
            {/* Close Button */}
            <button 
              onClick={() => setIsImageZoomed(false)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            
            {/* Zoomed Image */}
            <img 
              src={profileImageUrl} 
              alt="Zoomed profile" 
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl border-4 border-white/20 object-contain animate-scaleUp"
              onClick={(e) => e.stopPropagation()} 
            />
            <p className="text-white/80 mt-4 text-sm font-medium">চা বাগান Administrator</p>
          </div>
        </div>
      )}
    </>
  );
}