import { useState } from "react";
import { motion } from "framer-motion";
import Sparkline from "@/components/Sparkline";
import { useAuth } from "@/contexts/AuthContext";
import { useHealth } from "@/contexts/HealthContext";
import { generateRecipe } from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, X, PlayCircle, ListVideo } from "lucide-react";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Good Morning", emoji: "☀️" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  if (h >= 17 && h < 21) return { text: "Good Evening", emoji: "🌙" };
  return { text: "Good Night", emoji: "🌟" };
};

interface MealRecommendation {
  type: string;
  emoji: string;
  name: string;
  protein: string;
  carbs: string;
  fats: string;
  reason?: string;
  ingredients?: string[];
  instructions?: string[];
  youtubeQuery?: string;
}

const defaultMeals: MealRecommendation[] = [
  { type: "Breakfast", emoji: "🥣", name: "Oatmeal Power Bowl", protein: "18g", carbs: "45g", fats: "8g", reason: "Complex carbs for sustained morning energy." },
  { type: "Lunch", emoji: "🥗", name: "Grilled Chicken Salad", protein: "35g", carbs: "20g", fats: "12g", reason: "High protein to repair muscles." },
  { type: "Dinner", emoji: "🍲", name: "Salmon & Quinoa", protein: "30g", carbs: "38g", fats: "15g", reason: "Omega-3s for heart health." },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function HomePage() {
  const { user } = useAuth();
  const { healthData, preferences } = useHealth();
  const [aiMeals, setAiMeals] = useState<MealRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<MealRecommendation | null>(null);

  const greeting = getGreeting();

  // Reconstruct getMood locally since it needs healthData defined
  const getMood = (d: typeof healthData) => {
    // If stress is moderately high or heart rate is very high with some stress
    if (d.stress >= 7 || (d.heartRate > 95 && d.stress >= 5)) return { name: "Stressed", emoji: "😟", image: "/avatars/stressed.png", gradient: "from-red-500/30 to-pink-500/30" };

    // If sleep is remarkably low
    if (d.sleepHours < 6) return { name: "Tired", emoji: "😴", image: "/avatars/tired.png", gradient: "from-indigo-900/40 to-slate-800/40" };

    // If heart rate is elevated but stress is low
    if (d.heartRate > 80 && d.stress < 5) return { name: "Energized", emoji: "💪", image: "/avatars/energized.png", gradient: "from-emerald-500/30 to-teal-500/30" };

    // If perfectly in the zone
    if (d.heartRate >= 60 && d.heartRate <= 80 && d.stress <= 4 && d.spo2 >= 96) return { name: "Happy", emoji: "😄", image: "/avatars/happy.png", gradient: "from-yellow-500/30 to-orange-500/30" };

    // Default 
    return { name: "Calm", emoji: "😌", image: "/avatars/calm.png", gradient: "from-blue-500/30 to-purple-500/30" };
  };

  const mood = getMood(healthData);

  const handleGenerateRecipes = async () => {
    setIsGenerating(true);
    setError("");
    const prompt = `You are a professional nutrition AI. Based on the following user health data:
- Heart Rate: ${healthData.heartRate} BPM
- SpO2: ${healthData.spo2}%
- Sleep: ${healthData.sleepHours} hrs
- Stress Level (1-10): ${healthData.stress}
And their dietary preferences:
- Vegetarian: ${preferences.isVegetarian}
- Indian Cuisine: ${preferences.isIndian}

Generate exactly 3 personalized meal recommendations (Breakfast, Lunch, Dinner).
Provide the response strictly as a JSON array of objects with the following keys:
- "type" (e.g., "Breakfast")
- "emoji" (a single emoji representing the meal)
- "name" (name of the dish)
- "protein" (e.g., "20g")
- "carbs" (e.g., "30g")
- "fats" (e.g., "10g")
- "reason" (a short 1-sentence explanation of why this meal helps with their specific current health state, e.g., low sleep, high stress).
- "ingredients" (an array of strings, listing 4-6 primary ingredients with quantities)
- "instructions" (an array of strings, listing 3-5 short steps to cook the meal)
- "youtubeQuery" (a specific, highly relevant search string to find a recipe video for this exact dish on YouTube, prioritizing the cuisine style).

Do NOT wrap the JSON in markdown blocks (like \`\`\`json). Just return the raw JSON array.`;

    try {
      const responseText = await generateRecipe(prompt);
      // Clean up the text in case Gemini wraps it in markdown despite instructions
      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const meals = JSON.parse(cleanedText);
      setAiMeals(meals);
    } catch (err: any) {
      console.error(err);
      setError("Chef AI couldn't think of a recipe right now. Ask again later!");
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = [
    { icon: "❤️", label: "Heart Rate", value: `${healthData.heartRate} BPM`, color: "hsl(var(--glow-red))" },
    { icon: "🫁", label: "SpO2", value: `${healthData.spo2}%`, color: "hsl(var(--glow-blue))" },
    { icon: "😴", label: "Sleep", value: `${healthData.sleepHours} hrs`, color: "hsl(var(--glow-purple))" },
    { icon: "🧠", label: "Stress", value: `${healthData.stress}/10`, color: "hsl(var(--glow-green))" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {greeting.text}, {user?.displayName ? user.displayName.split(' ')[0] : 'Guest'}! {greeting.emoji}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's how your body feels today</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mood Card */}
          <motion.div variants={fadeUp} className="p-6 relative overflow-hidden flex justify-center w-full">
            <div className="absolute inset-0 bg-transparent" />
            <div className="relative flex flex-col items-center py-4">
              <motion.div
                animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src={mood.image}
                  alt={mood.name}
                  className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl"
                  onError={(e) => {
                    // Fallback avatar if local missing
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/notionists/svg?seed=${mood.name}&backgroundColor=transparent`;
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Health Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="glass-card p-4" style={{ boxShadow: `0 0 20px ${s.color}20` }}>
                <span className="text-2xl">{s.icon}</span>
                <p className="text-xl font-bold text-foreground mt-2">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <Sparkline color={s.color} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recommendations 🍽️</h2>
            <Button onClick={handleGenerateRecipes} disabled={isGenerating} size="sm" className="gap-2 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-md">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
              Gen Recipe
            </Button>
          </motion.div>

          {error && <p className="text-sm text-red-500 px-2 mb-2">{error}</p>}

          <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 glass-card border-dashed">
                <ChefHat className="w-12 h-12 text-muted-foreground animate-bounce mb-4" />
                <p className="text-sm font-medium text-foreground">Chef AI is cooking...</p>
                <p className="text-xs text-muted-foreground mt-1 text-center">Analyzing your vitals to find the perfect meal</p>
              </div>
            ) : (
              (aiMeals.length > 0 ? aiMeals : defaultMeals).map((m) => (
                <motion.div
                  key={m.type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, boxShadow: "0 8px 30px hsl(var(--glow-green) / 0.15)" }}
                  className="glass-card p-4 min-w-[280px] lg:min-w-0 cursor-pointer"
                >
                  <p className="text-xs text-muted-foreground font-medium">{m.type}</p>
                  <p className="text-lg mt-1">
                    <span className="mr-2">{m.emoji}</span>
                    <span className="font-semibold text-foreground">{m.name}</span>
                  </p>
                  {m.reason && (
                    <p className="text-xs text-muted-foreground italic mt-2 py-1.5 px-3 bg-muted/50 rounded-md border-l-2 border-primary">
                      {m.reason}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[`🔴 ${m.protein}`, `🟡 ${m.carbs}`, `🟢 ${m.fats}`].map((chip) => (
                      <span key={chip} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground/80 font-medium">
                        {chip}
                      </span>
                    ))}
                  </div>
                  {(m.ingredients || m.instructions) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-xs text-primary bg-primary/10 hover:bg-primary/20"
                      onClick={() => setSelectedRecipe(m)}
                    >
                      View Full Recipe
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl overflow-hidden glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    {selectedRecipe.emoji} {selectedRecipe.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">{selectedRecipe.type} • {selectedRecipe.protein} Protein</p>
                </div>
                <button onClick={() => setSelectedRecipe(null)} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {selectedRecipe.reason && (
                <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg mb-6 text-sm italic text-foreground/90">
                  {selectedRecipe.reason}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg border-b border-border pb-2 mb-3">Ingredients</h4>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients ? selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="text-muted-foreground">{ing}</span>
                      </li>
                    )) : <p className="text-sm text-muted-foreground">Ingredients not generated.</p>}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg border-b border-border pb-2 mb-3">Instructions</h4>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions ? selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="text-sm flex gap-3">
                        <span className="bg-primary/20 text-primary font-medium w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    )) : <p className="text-sm text-muted-foreground">Instructions not generated.</p>}
                  </ol>
                </div>
              </div>

              {selectedRecipe.youtubeQuery && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="font-semibold flex items-center gap-2 mb-4">
                    <ListVideo className="text-red-500" size={20} /> Watch Tutorial
                  </h4>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted relative">
                    {/* Using YouTube search iframe wrapper since actual direct video ID isn't known deterministically by simple prompt, but search URL works well natively or via an embed wrapper */}
                    <iframe
                      title="YouTube Recipe Tutorial"
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(selectedRecipe.youtubeQuery)}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
