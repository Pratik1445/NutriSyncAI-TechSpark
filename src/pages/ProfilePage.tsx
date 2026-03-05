import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useHealth } from "@/contexts/HealthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const achievements = [
  { emoji: "🥗", label: "Salad Streak", earned: true },
  { emoji: "💧", label: "Hydration Hero", earned: true },
  { emoji: "🏃", label: "Active Week", earned: true },
  { emoji: "🌱", label: "Eco Eater", earned: false },
  { emoji: "🔥", label: "7 Day Streak", earned: true },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { preferences, setPreferences } = useHealth();

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <motion.h1 variants={fadeUp} className="text-2xl font-bold text-foreground">Profile 👤</motion.h1>
        <Button variant="outline" size="sm" onClick={logout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left */}
        <div className="space-y-4">
          {/* Profile Card */}
          <motion.div variants={fadeUp} className="glass-card p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "👨"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.displayName || "Nutrition Enthusiast"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">NutriSync Member 🌟</span>
            </div>
          </motion.div>

          {/* Health Profile */}
          <motion.div variants={fadeUp} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Health Profile</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Age", value: "25" },
                { label: "Height", value: "175 cm" },
                { label: "Weight", value: "70 kg" },
                { label: "Goal", value: "Balanced Diet" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
            {[
              { label: "Meals Logged", value: "18" },
              { label: "Streak", value: "🔥 7 days" },
              { label: "Nutrition Score", value: "84/100" },
              { label: "Avg Water", value: "2.1L" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4 text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Preferences */}
          <motion.div variants={fadeUp} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">🌱 Vegetarian Mode</span>
                <button
                  onClick={() => setPreferences((prev) => ({ ...prev, isVegetarian: !prev.isVegetarian }))}
                  className={`btn-press w-11 h-6 rounded-full relative transition-colors ${preferences.isVegetarian ? "bg-primary" : "bg-muted"}`}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-foreground absolute top-0.5"
                    animate={{ left: preferences.isVegetarian ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">🇮🇳 Indian Recipes</span>
                <button
                  onClick={() => setPreferences((prev) => ({ ...prev, isIndian: !prev.isIndian }))}
                  className={`btn-press w-11 h-6 rounded-full relative transition-colors ${preferences.isIndian ? "bg-primary" : "bg-muted"}`}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-foreground absolute top-0.5"
                    animate={{ left: preferences.isIndian ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div variants={fadeUp} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Your Achievements 🏆</h3>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((a) => (
                <motion.div
                  key={a.label}
                  whileHover={{ scale: 1.05 }}
                  className={`p-3 rounded-xl text-center transition-opacity ${a.earned ? "" : "opacity-30 grayscale"}`}
                  style={a.earned ? { background: "hsl(var(--muted) / 0.5)" } : {}}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
