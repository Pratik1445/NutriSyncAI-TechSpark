import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, PenLine, X, ChevronDown, Loader2, ChefHat, Upload } from "lucide-react";
import { generateRecipe, generateRecipeFromImage } from "@/lib/gemini";
import { useHealth } from "@/contexts/HealthContext";
import { useToast } from "@/hooks/use-toast";

const quickIngredients = [
  { emoji: "🥚", name: "Eggs" }, { emoji: "🍗", name: "Chicken" },
  { emoji: "🥛", name: "Milk" }, { emoji: "🥦", name: "Broccoli" },
  { emoji: "🍚", name: "Rice" }, { emoji: "🫒", name: "Olive Oil" },
  { emoji: "🧅", name: "Onion" }, { emoji: "🍋", name: "Lemon" },
];

const mockRecipes = [
  { name: "Chicken Stir Fry", cuisine: "🥢 Asian", time: "25 min", cal: "420 kcal", match: 92, steps: ["Heat oil in a wok", "Add diced chicken, cook 5 min", "Add vegetables, stir fry 3 min", "Season with soy sauce and serve with rice"] },
  { name: "Veggie Omelette", cuisine: "🍳 Western", time: "15 min", cal: "280 kcal", match: 88, steps: ["Whisk eggs with salt", "Heat pan with olive oil", "Pour eggs, add broccoli & onion", "Fold and serve"] },
  { name: "Lemon Herb Rice Bowl", cuisine: "🌿 Mediterranean", time: "30 min", cal: "350 kcal", match: 78, steps: ["Cook rice until fluffy", "Sauté vegetables in olive oil", "Squeeze lemon and add herbs", "Combine and serve warm"] },
];

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function ScanPage() {
  const { healthData, preferences } = useHealth();
  const { toast } = useToast();

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [aiRecipes, setAiRecipes] = useState<typeof mockRecipes>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleIngredient = (name: string) => {
    setIngredients((prev) => prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      setShowResults(true);

      setIsGenerating(true);
      try {
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        const prompt = `You are a professional nutritionist AI. Analyze the food or ingredients in this image. 
Based on these ingredients and the user's health profile (HR ${healthData.heartRate}, SpO2 ${healthData.spo2}%, Sleep ${healthData.sleepHours}h, Stress ${healthData.stress}/10) and preferences (Veg: ${preferences.isVegetarian}, Indian: ${preferences.isIndian}):
Generate exactly 3 healthy recipe suggestions.
Respond ONLY with a valid JSON array of objects. Each object must have these exact keys:
- "name" (recipe name)
- "cuisine" (e.g., "🥢 Asian", "🇮🇳 Indian")
- "time" (e.g., "25 min")
- "cal" (estimated calories, e.g., "420 kcal")
- "match" (a number between 70 and 100 representing how well it matches their health goals)
- "steps" (an array of 3-5 short instruction strings)`;

        const text = await generateRecipeFromImage(base64Data, mimeType, prompt);
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        setAiRecipes(JSON.parse(cleanedText));
      } catch (err) {
        console.error(err);
        toast({ title: "Scan Failed", description: "Chef AI couldn't parse the image.", variant: "destructive" });
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateText = async () => {
    if (ingredients.length === 0) {
      toast({ title: "No ingredients", description: "Please add some ingredients first." });
      return;
    }

    setShowManual(false);
    setShowResults(true);
    setIsGenerating(true);
    setPreviewImage(null); // Clear image if switching to text

    try {
      const prompt = `You are a professional nutritionist AI. I have the following ingredients: ${ingredients.join(", ")}.
Based on these AND the user's health profile (HR ${healthData.heartRate}, SpO2 ${healthData.spo2}%, Sleep ${healthData.sleepHours}h, Stress ${healthData.stress}/10) and preferences (Veg: ${preferences.isVegetarian}, Indian: ${preferences.isIndian}):
Generate exactly 3 healthy recipe suggestions that primarily use these ingredients.
Respond ONLY with a valid JSON array of objects. Each object must have these exact keys:
- "name" (recipe name)
- "cuisine" (e.g., "🥢 Asian", "🇮🇳 Indian")
- "time" (e.g., "25 min")
- "cal" (estimated calories, e.g., "420 kcal")
- "match" (a number between 70 and 100 representing how well it matches their health goals)
- "steps" (an array of 3-5 short instruction strings)`;

      const text = await generateRecipe(prompt);
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      setAiRecipes(JSON.parse(cleanedText));
    } catch (err) {
      console.error(err);
      toast({ title: "Generation Failed", description: "Chef AI couldn't make a recipe.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = quickIngredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-6xl mx-auto">
      <motion.h1 variants={fadeUp} className="text-2xl font-bold text-foreground mb-6">Scan Ingredients 📷</motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera */}
        <motion.div variants={fadeUp} className="space-y-4">
          <div className="glass-card aspect-[4/3] relative overflow-hidden flex items-center justify-center">
            {previewImage ? (
              <img src={previewImage} alt="Scanned ingredients" className="w-full h-full object-cover" />
            ) : (
              <>
                {/* Corner brackets */}
                {[["top-4 left-4", "border-t-2 border-l-2"], ["top-4 right-4", "border-t-2 border-r-2"], ["bottom-4 left-4", "border-b-2 border-l-2"], ["bottom-4 right-4", "border-b-2 border-r-2"]].map(([pos, border], i) => (
                  <div key={i} className={`absolute ${pos} w-10 h-10 ${border} border-primary rounded-sm animate-pulse-glow`} />
                ))}
                {/* Scan line */}
                <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
                <p className="text-muted-foreground text-sm text-center px-8">Point at ingredients or food items</p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />
            <button onClick={triggerFileInput} className="btn-press flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium flex items-center justify-center gap-2">
              <Camera size={18} /> Open Camera
            </button>
            <button onClick={() => triggerFileInput()} className="btn-press p-3 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <Upload size={18} />
            </button>
            <button onClick={() => setShowManual(true)} className="btn-press flex-1 py-3 rounded-xl border border-border text-foreground font-medium flex items-center justify-center gap-2">
              <PenLine size={18} /> Manual Entry
            </button>
          </div>
        </motion.div>

        {/* Right: Results */}
        <motion.div variants={fadeUp}>
          <AnimatePresence mode="wait">
            {showResults ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="glass-card p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    {previewImage ? "Analyzing image..." : `Using ${ingredients.length} ingredients 🥗`}
                  </h3>
                  {!previewImage && (
                    <div className="flex flex-wrap gap-2">
                      {ingredients.map((ing) => (
                        <span key={ing} className="px-3 py-1 rounded-full bg-primary/15 text-primary text-sm">{ing}</span>
                      ))}
                    </div>
                  )}
                </div>

                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-8 mt-2 border border-dashed border-border rounded-xl">
                    <ChefHat className="w-10 h-10 text-muted-foreground animate-bounce mb-3" />
                    <p className="text-sm font-medium text-foreground">Chef AI is generating recipes...</p>
                  </div>
                ) : (
                  (aiRecipes.length > 0 ? aiRecipes : mockRecipes).map((r, i) => (
                    <motion.div key={r.name} className="glass-card p-4 cursor-pointer" whileHover={{ scale: 1.01 }} onClick={() => setExpandedRecipe(expandedRecipe === i ? null : i)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.cuisine}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">{r.match}% match</span>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span>⏱ {r.time}</span><span>🔥 {r.cal}</span><span>✅ Health matched</span>
                      </div>
                      <AnimatePresence>
                        {expandedRecipe === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              {r.steps.map((s: string, si: number) => (
                                <p key={si} className="text-sm text-muted-foreground"><span className="text-primary font-medium">{si + 1}.</span> {s}</p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <ChevronDown size={16} className={`mx-auto mt-2 text-muted-foreground transition-transform ${expandedRecipe === i ? "rotate-180" : ""}`} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 flex flex-col items-center justify-center min-h-[300px]">
                <span className="text-5xl mb-4">🍳</span>
                <p className="text-muted-foreground text-center">Scan or add ingredients to get recipe suggestions</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Manual Add Sheet */}
      <AnimatePresence>
        {showManual && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center lg:justify-end" onClick={() => setShowManual(false)}>
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="glass-card p-6 w-full lg:w-96 lg:mr-8 lg:rounded-2xl rounded-t-3xl rounded-b-none lg:rounded-b-2xl max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Add Ingredients</h3>
                <button onClick={() => setShowManual(false)} className="btn-press text-muted-foreground"><X size={20} /></button>
              </div>

              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ingredients..." className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm mb-4 outline-none focus:ring-1 focus:ring-primary" />

              <div className="flex flex-wrap gap-2 mb-4">
                {filtered.map((ing) => (
                  <button
                    key={ing.name}
                    onClick={() => toggleIngredient(ing.name)}
                    className={`btn-press px-3 py-1.5 rounded-full text-sm transition-all ${ingredients.includes(ing.name) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {ing.emoji} {ing.name}
                  </button>
                ))}
              </div>

              {ingredients.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Added ({ingredients.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing) => (
                      <span key={ing} className="px-3 py-1 rounded-full bg-primary/15 text-primary text-sm flex items-center gap-1">
                        {ing} <button onClick={() => toggleIngredient(ing)}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleGenerateText} className="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium flex items-center justify-center gap-2">
                <ChefHat size={18} /> Generate Recipes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
