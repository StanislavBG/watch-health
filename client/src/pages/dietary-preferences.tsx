import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useProfile, useUpdateProfile } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

const DIETARY_PATTERNS = [
  { id: "omnivore", label: "Omnivore", desc: "No restrictions" },
  { id: "vegetarian", label: "Vegetarian", desc: "No meat or fish" },
  { id: "vegan", label: "Vegan", desc: "No animal products" },
  { id: "pescatarian", label: "Pescatarian", desc: "Fish but no meat" },
  { id: "basketarian", label: "Basketarian", desc: "Flexible plant-based" },
  { id: "flexitarian", label: "Flexitarian", desc: "Mostly plant-based, occasional meat" },
];

const HEALTH_GOALS = [
  { id: "hormonal_balance", label: "Hormonal Balance", desc: "Foods that support hormonal regulation" },
  { id: "skin_health", label: "Skin Health", desc: "Antioxidants, omega-3s, vitamins for skin repair" },
  { id: "fat_loss", label: "Fat Loss", desc: "Calorie-conscious, satiating meal suggestions" },
  { id: "performance", label: "Athletic Performance", desc: "Fuel for training and competition" },
  { id: "energy", label: "Sustained Energy", desc: "Balanced meals to avoid energy crashes" },
  { id: "recovery", label: "Better Recovery", desc: "Anti-inflammatory foods, protein timing" },
];

const COMMON_ALLERGENS = ["Peanuts", "Tree nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Shellfish", "Sesame"];

export default function DietaryPreferencesPage() {
  const [, navigate] = useLocation();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [dietaryPattern, setDietaryPattern] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [religiousRestrictions, setReligiousRestrictions] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [flexibleRules, setFlexibleRules] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newRule, setNewRule] = useState("");

  useEffect(() => {
    if (profile && profile.id) {
      setDietaryPattern(profile.dietaryPattern || "");
      setAllergies(profile.allergies || []);
      setIntolerances(profile.intolerances || []);
      setReligiousRestrictions(profile.religiousRestrictions || []);
      setExcludedIngredients(profile.excludedIngredients || []);
      setHealthGoals(profile.healthGoals || []);
      setFlexibleRules(profile.flexibleRules || []);
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      dietaryPattern,
      allergies,
      intolerances,
      religiousRestrictions,
      excludedIngredients,
      healthGoals,
      flexibleRules,
    });
    toast({ title: "Preferences saved", description: "Your dietary preferences have been updated. Future recommendations will reflect these changes." });
  };

  const addToList = (list: string[], setList: (v: string[]) => void, item: string) => {
    const trimmed = item.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const removeFromList = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-600">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
          <span className="font-semibold text-gray-900">Dietary Preferences</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Dietary Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dietary Pattern</CardTitle>
            <CardDescription>
              Pick what fits best. This is flexible -- if you eat mostly one way but not strictly, that's fine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_PATTERNS.map((d) => (
                <Button
                  key={d.id}
                  variant={dietaryPattern === d.id ? "default" : "outline"}
                  className={`h-auto py-2 px-3 justify-start ${dietaryPattern === d.id ? "bg-emerald-600" : ""}`}
                  onClick={() => setDietaryPattern(d.id)}
                >
                  <div className="text-left">
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className={`text-xs ${dietaryPattern === d.id ? "text-emerald-100" : "text-gray-400"}`}>{d.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flexible Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flexible Rules</CardTitle>
            <CardDescription>
              Add exceptions to your dietary pattern. Examples: "Fish on weekends", "Sometimes dairy", "No red meat on Mondays".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Fish on weekends only"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addToList(flexibleRules, setFlexibleRules, newRule);
                    setNewRule("");
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  addToList(flexibleRules, setFlexibleRules, newRule);
                  setNewRule("");
                }}
              >
                Add
              </Button>
            </div>
            {flexibleRules.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {flexibleRules.map((rule, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeFromList(flexibleRules, setFlexibleRules, i)}
                  >
                    {rule} &times;
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergies & Intolerances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Allergies & Intolerances</CardTitle>
            <CardDescription>
              These are treated as non-negotiable. Recommendations will never include these items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Common allergens (tap to toggle)</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGENS.map((allergen) => {
                  const isSelected = allergies.includes(allergen);
                  return (
                    <Badge
                      key={allergen}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer ${isSelected ? "bg-red-500 hover:bg-red-600" : ""}`}
                      onClick={() => {
                        if (isSelected) {
                          setAllergies(allergies.filter((a) => a !== allergen));
                        } else {
                          setAllergies([...allergies, allergen]);
                        }
                      }}
                    >
                      {allergen}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Intolerances (not allergies, but cause discomfort)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., lactose, gluten, fructose"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addToList(intolerances, setIntolerances, newItem);
                      setNewItem("");
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    addToList(intolerances, setIntolerances, newItem);
                    setNewItem("");
                  }}
                >
                  Add
                </Button>
              </div>
              {intolerances.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {intolerances.map((item, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeFromList(intolerances, setIntolerances, i)}
                    >
                      {item} &times;
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Religious / Cultural Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Religious & Cultural Restrictions</CardTitle>
            <CardDescription>
              The system will consistently respect these rules in all recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {["Halal", "Kosher", "No beef", "No pork", "Jain vegetarian"].map((restriction) => {
                const isSelected = religiousRestrictions.includes(restriction);
                return (
                  <div key={restriction} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rel-${restriction}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setReligiousRestrictions([...religiousRestrictions, restriction]);
                        } else {
                          setReligiousRestrictions(religiousRestrictions.filter((r) => r !== restriction));
                        }
                      }}
                    />
                    <Label htmlFor={`rel-${restriction}`} className="text-sm cursor-pointer">{restriction}</Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Excluded Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Excluded Ingredients</CardTitle>
            <CardDescription>
              Specific ingredients you want to avoid for any reason (preference, taste, health).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., cilantro, mushrooms, coconut"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addToList(excludedIngredients, setExcludedIngredients, newItem);
                    setNewItem("");
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  addToList(excludedIngredients, setExcludedIngredients, newItem);
                  setNewItem("");
                }}
              >
                Add
              </Button>
            </div>
            {excludedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {excludedIngredients.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeFromList(excludedIngredients, setExcludedIngredients, i)}
                  >
                    {item} &times;
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Goals</CardTitle>
            <CardDescription>
              Select goals to tailor your recommendations. You can change these anytime as your priorities shift.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {HEALTH_GOALS.map((goal) => {
                const isSelected = healthGoals.includes(goal.id);
                return (
                  <div
                    key={goal.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setHealthGoals(healthGoals.filter((g) => g !== goal.id));
                      } else {
                        setHealthGoals([...healthGoals, goal.id]);
                      }
                    }}
                  >
                    <Checkbox checked={isSelected} />
                    <div>
                      <div className="text-sm font-medium">{goal.label}</div>
                      <div className="text-xs text-gray-500">{goal.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
