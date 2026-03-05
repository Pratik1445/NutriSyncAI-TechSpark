import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, ChefHat } from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useHealth } from "@/contexts/HealthContext";
import { useToast } from "@/hooks/use-toast";
import { generateRecipe } from "@/lib/gemini";
import { Button } from "@/components/ui/button";

interface Member {
  id: string;
  name: string;
  relationship: string;
  emoji: string;
  status: string;
  health: {
    heartRate: number;
    spo2: number;
    sleepHours: number;
    stress: number;
  };
}

const relationships = [
  { label: "Dad", emoji: "👨" },
  { label: "Mom", emoji: "👩" },
  { label: "Sis", emoji: "👧" },
  { label: "Bro", emoji: "👦" },
  { label: "Friend", emoji: "👫" },
  { label: "Colleague", emoji: "💼" },
];

const statuses = ["Healthy", "Active", "Resting"];

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function FamilyPage() {
  const { user } = useAuth();
  const { healthData, preferences } = useHealth();
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedRel, setSelectedRel] = useState(relationships[0]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [familyMeals, setFamilyMeals] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddMember = async () => {
    if (!newEmail.trim()) {
      toast({ title: "Email required", description: "Please enter the member's email address.", variant: "destructive" });
      return;
    }

    try {
      const q = query(collection(db, "users"), where("email", "==", newEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "User not found", description: "This user does not have an account on our app.", variant: "destructive" });
        return;
      }

      const addedUser = querySnapshot.docs[0].data();

      const newMember: Member = {
        id: addedUser.uid || Date.now().toString(),
        name: addedUser.displayName || addedUser.name || newName || "Family Member",
        relationship: selectedRel.label,
        emoji: selectedRel.emoji,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        health: {
          heartRate: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
          spo2: Math.floor(Math.random() * (100 - 92 + 1)) + 92,
          sleepHours: Number((Math.random() * (9 - 5) + 5).toFixed(1)),
          stress: Math.floor(Math.random() * 8) + 1,
        }
      };

      setMembers((prev) => [...prev, newMember]);

      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          family: arrayUnion({ email: newEmail.trim(), relationship: selectedRel.label, emoji: selectedRel.emoji })
        }).catch(e => console.error("Could not save to firestore", e));
      }

      setNewName("");
      setNewEmail("");
      setShowModal(false);
      toast({ title: "Success", description: `${newMember.name} has been added to your family!` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "An error occurred while adding the member.", variant: "destructive" });
    }
  };

  const handleGenerateFamilyMeal = async () => {
    setIsGenerating(true);
    const familyProfiles = members.map(m => `${m.name} (${m.relationship}): HR ${m.health.heartRate}, SpO2 ${m.health.spo2}%, Sleep ${m.health.sleepHours}h, Stress ${m.health.stress}/10`).join('\n');

    const prompt = `You are a professional nutrition AI planning meals for a family.
Current user health: HR ${healthData.heartRate}, SpO2 ${healthData.spo2}%, Sleep ${healthData.sleepHours}h, Stress ${healthData.stress}/10
Family members health:
${familyProfiles}

Dietary preferences for the household:
- Vegetarian: ${preferences.isVegetarian}
- Indian Cuisine: ${preferences.isIndian}

Generate exactly 2 family meal recommendations that would suit EVERYONE's current health states. 
Respond ONLY with a valid JSON array of objects. Each object must have these exactly named keys:
- "name" (name of the dish)
- "tags" (an array of 2-3 short strings, e.g. ["✅ Suits Everyone", "⚡ Energizing"])
- "reason" (A 1-sentence explanation of why this meal is perfect for the combined health profiles of the family).
Do NOT wrap the JSON in markdown blocks.`;

    try {
      const text = await generateRecipe(prompt);
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      setFamilyMeals(JSON.parse(cleanedText));
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate family meals.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-6xl mx-auto">
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Family 👨‍👩‍👧</h1>
        <button onClick={() => setShowModal(true)} className="btn-press flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          <Plus size={16} /> Add Member
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <motion.div variants={fadeUp} className="space-y-3">
          {members.map((m) => (
            <motion.div
              key={m.id}
              layout
              className="glass-card p-4 cursor-pointer"
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.relationship}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${m.status === "Healthy" ? "bg-primary/15 text-primary" :
                  m.status === "Active" ? "bg-secondary/15 text-secondary" :
                    "bg-accent/15 text-accent"
                  }`}>
                  {m.status}
                </span>
              </div>
              <AnimatePresence>
                {expanded === m.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                      <div className="text-center"><p className="text-lg font-bold text-foreground">{m.health.heartRate}</p><p className="text-[10px] text-muted-foreground">Heart Rate</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-foreground">{m.health.spo2}%</p><p className="text-[10px] text-muted-foreground">SpO2</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-foreground">{m.health.sleepHours}h</p><p className="text-[10px] text-muted-foreground">Sleep</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-foreground">{m.health.stress}/10</p><p className="text-[10px] text-muted-foreground">Stress</p></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Family Meal Plan */}
        <motion.div variants={fadeUp} className="glass-card p-6 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">🍽️ Family Meal Plan</h2>
              <p className="text-sm text-muted-foreground">{members.length === 0 ? "Add members to optimize" : `Optimized for all ${members.length + 1} members`}</p>
            </div>
            <Button onClick={handleGenerateFamilyMeal} disabled={isGenerating || members.length === 0} size="sm" className="gap-2 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-md">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
              Gen Meal
            </Button>
          </div>

          <div className="flex-1">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 mt-2 border border-dashed border-border rounded-xl">
                <ChefHat className="w-10 h-10 text-muted-foreground animate-bounce mb-3" />
                <p className="text-sm font-medium text-foreground">Analyzing family needs...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border mt-2">
                <p className="text-sm text-muted-foreground">Add some family members first to generate a meal plan that matches everyone's health goals.</p>
              </div>
            ) : familyMeals.length > 0 ? (
              familyMeals.map((meal, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-muted/30 mb-3 border border-border/50">
                  <p className="font-semibold text-foreground">{meal.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-2 italic">"{meal.reason}"</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {meal.tags.map((t: string) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border mt-2">
                <p className="text-sm text-muted-foreground">Click 'Gen Meal' to create a recipe that suits your entire family's current health metrics.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Add Family Member</h3>
                <button onClick={() => setShowModal(false)} className="btn-press text-muted-foreground"><X size={20} /></button>
              </div>

              <p className="text-sm text-muted-foreground mb-3">Relationship</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {relationships.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setSelectedRel(r)}
                    className={`btn-press px-3 py-1.5 rounded-full text-sm transition-all ${selectedRel.label === r.label ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {r.emoji} {r.label}
                  </button>
                ))}
              </div>

              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm mb-3 outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm mb-4 outline-none focus:ring-1 focus:ring-primary"
              />

              <button onClick={handleAddMember} className="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium">
                Add to Family
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
