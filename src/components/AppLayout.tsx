import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Users, Camera, ShoppingCart, User as UserIcon, Settings, ScanLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", label: "Home", icon: Home, emoji: "🏠" },
  { path: "/family", label: "Family", icon: Users, emoji: "👨‍👩‍👧" },
  { path: "/scan", label: "Scan", icon: ScanLine, emoji: "📷" },
  { path: "/grocery", label: "Grocery", icon: ShoppingCart, emoji: "🛒" },
  { path: "/profile", label: "Profile", icon: UserIcon, emoji: "👤" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-radial-glow flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40">
        <div className="p-6">
          <h1 className="text-xl font-bold text-foreground">NutriSync AI 🥗</h1>
          <p className="text-xs text-muted-foreground mt-1">Smart Nutrition</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`btn-press w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                    ? "bg-primary/15 text-primary glow-green"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-lg">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "👨"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.displayName || "Nutrition Enthusiast"}</p>
            <p className="text-xs text-muted-foreground">NutriSync Member</p>
          </div>
          <button className="btn-press text-muted-foreground hover:text-foreground">
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 pb-24 lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav z-50 safe-area-bottom">
        <div className="flex items-end justify-around px-2 pt-2 pb-2">
          {navItems.map((item, i) => {
            const active = location.pathname === item.path;
            const isCenter = i === 2;

            if (isCenter) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="btn-press -mt-5 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg glow-green"
                >
                  <Camera size={24} className="text-primary-foreground" />
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="btn-press flex flex-col items-center gap-0.5 py-1 px-3"
              >
                <item.icon size={20} className={active ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-[10px] ${active ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
