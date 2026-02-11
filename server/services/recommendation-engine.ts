import type { IStorage } from "../storage";
import type { UserProfile, Recommendation } from "@shared/schema";

interface MealSuggestion {
  title: string;
  description: string;
  details: Record<string, unknown>;
  alternatives: Array<{ title: string; description: string }>;
}

const MEAL_DATABASE: Record<string, MealSuggestion[]> = {
  high_activity: [
    {
      title: "Post-Workout Power Bowl",
      description: "Brown rice with grilled chicken, avocado, sweet potato, and tahini dressing. High protein for muscle recovery.",
      details: { calories: 650, protein: 42, carbs: 68, fat: 22, timing: "within 45 minutes post-exercise" },
      alternatives: [
        { title: "Salmon & Quinoa Bowl", description: "Grilled salmon over quinoa with roasted vegetables and lemon-herb sauce" },
        { title: "Lentil Power Plate", description: "Red lentil curry with brown rice, spinach, and coconut cream" },
      ],
    },
    {
      title: "Hydration Boost: Electrolyte Recovery",
      description: "Water with a pinch of sea salt, lemon juice, and a teaspoon of honey. Replenishes minerals lost during exercise.",
      details: { sodium: "400mg", potassium: "200mg", timing: "during and after exercise" },
      alternatives: [
        { title: "Coconut Water Mix", description: "Coconut water with a squeeze of lime and pinch of salt" },
        { title: "Watermelon Hydrator", description: "Blended watermelon with mint and a pinch of salt" },
      ],
    },
  ],
  moderate_activity: [
    {
      title: "Balanced Lunch: Mediterranean Plate",
      description: "Whole-grain pita with hummus, grilled vegetables, feta cheese, and olive oil. Supports steady energy throughout the day.",
      details: { calories: 520, protein: 22, carbs: 58, fat: 24 },
      alternatives: [
        { title: "Asian Noodle Bowl", description: "Soba noodles with tofu, edamame, and sesame-ginger dressing" },
        { title: "Stuffed Sweet Potato", description: "Baked sweet potato with black beans, corn, and avocado crema" },
      ],
    },
    {
      title: "Afternoon Hydration Reminder",
      description: "You've been moderately active today. Aim for another 500ml of water before evening.",
      details: { targetMl: 500, timing: "afternoon" },
      alternatives: [
        { title: "Green Tea", description: "A cup of green tea for gentle hydration with antioxidants" },
        { title: "Cucumber Infused Water", description: "Chilled water with cucumber slices and mint" },
      ],
    },
  ],
  low_activity: [
    {
      title: "Light & Nourishing: Garden Salad",
      description: "Mixed greens with walnuts, dried cranberries, grilled halloumi, and balsamic vinaigrette. Light but satisfying for a quieter day.",
      details: { calories: 380, protein: 18, carbs: 32, fat: 20 },
      alternatives: [
        { title: "Vegetable Soup", description: "Hearty minestrone with beans, kale, and a slice of sourdough" },
        { title: "Greek Yogurt Parfait", description: "Greek yogurt with granola, mixed berries, and a drizzle of honey" },
      ],
    },
    {
      title: "Gentle Hydration Reminder",
      description: "Even on rest days, staying hydrated supports recovery and skin health. Aim for your next glass of water.",
      details: { targetMl: 250, timing: "regular intervals" },
      alternatives: [
        { title: "Herbal Tea", description: "Chamomile or peppermint tea for calming hydration" },
        { title: "Warm Lemon Water", description: "Warm water with lemon to support digestion and hydration" },
      ],
    },
  ],
  skin_health: [
    {
      title: "Skin-Boosting Snack: Berry Smoothie",
      description: "Blueberries, spinach, flaxseed, and almond milk. Rich in antioxidants and omega-3s for skin repair and glow.",
      details: { vitaminC: "45mg", omega3: "2g", antioxidants: "high" },
      alternatives: [
        { title: "Avocado Toast with Seeds", description: "Whole grain toast with avocado, hemp seeds, and a squeeze of lemon" },
        { title: "Carrot-Ginger Juice", description: "Fresh carrot juice with ginger and turmeric for anti-inflammatory benefits" },
      ],
    },
  ],
  hormonal_balance: [
    {
      title: "Hormone-Supportive Dinner",
      description: "Baked salmon with roasted broccoli and sweet potato. Rich in omega-3s, cruciferous vegetables, and complex carbs for hormonal regulation.",
      details: { omega3: "3.2g", fiber: "8g", vitaminD: "600IU" },
      alternatives: [
        { title: "Tempeh Stir-Fry", description: "Tempeh with bok choy, shiitake mushrooms, and brown rice" },
        { title: "Chickpea Curry", description: "Turmeric chickpea curry with spinach and coconut milk" },
      ],
    },
  ],
  recovery: [
    {
      title: "Recovery Day Nutrition",
      description: "Your body is recovering. Focus on anti-inflammatory foods: tart cherry juice, turmeric milk, and lean protein.",
      details: { focus: "anti-inflammatory", timing: "throughout the day" },
      alternatives: [
        { title: "Bone Broth", description: "Warm bone broth with ginger for joint and muscle recovery" },
        { title: "Banana-Almond Butter", description: "Banana with almond butter for easy-to-digest recovery fuel" },
      ],
    },
  ],
};

export class RecommendationEngine {
  constructor(private storage: IStorage) {}

  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    const profile = await this.storage.getProfile(userId);
    const activityLevel = await this.storage.getRecentActivityLevel(userId);
    const existing = await this.storage.getRecommendations(userId, "pending");

    // Don't overwhelm with recommendations
    if (existing.length >= 5) return existing;

    const suggestions = this.selectSuggestions(activityLevel, profile);
    const created: Recommendation[] = [];

    for (const suggestion of suggestions) {
      const filtered = this.applyDietaryFilters(suggestion, profile);
      const rec = await this.storage.createRecommendation({
        userId,
        type: this.inferType(filtered),
        title: filtered.title,
        description: filtered.description,
        details: filtered.details,
        alternatives: filtered.alternatives,
        priority: this.calculatePriority(activityLevel, filtered),
        scheduledFor: null,
        status: "pending",
      });
      created.push(rec);
    }

    return created;
  }

  private selectSuggestions(activityLevel: string, profile: UserProfile | undefined): MealSuggestion[] {
    const suggestions: MealSuggestion[] = [];

    // Activity-based suggestions
    if (activityLevel === "very_active" || activityLevel === "active") {
      suggestions.push(...this.pickRandom(MEAL_DATABASE.high_activity, 1));
    } else if (activityLevel === "moderate") {
      suggestions.push(...this.pickRandom(MEAL_DATABASE.moderate_activity, 1));
    } else {
      suggestions.push(...this.pickRandom(MEAL_DATABASE.low_activity, 1));
    }

    // Health-goal-based suggestions
    if (profile?.healthGoals.includes("skin_health")) {
      suggestions.push(...this.pickRandom(MEAL_DATABASE.skin_health, 1));
    }
    if (profile?.healthGoals.includes("hormonal_balance")) {
      suggestions.push(...this.pickRandom(MEAL_DATABASE.hormonal_balance, 1));
    }

    // Recovery suggestion if recent high activity
    if (activityLevel === "very_active") {
      suggestions.push(...this.pickRandom(MEAL_DATABASE.recovery, 1));
    }

    return suggestions;
  }

  private applyDietaryFilters(suggestion: MealSuggestion, profile: UserProfile | undefined): MealSuggestion {
    if (!profile) return suggestion;

    const excluded = [
      ...profile.allergies,
      ...profile.intolerances,
      ...profile.excludedIngredients,
    ].map((s) => s.toLowerCase());

    if (excluded.length === 0) return suggestion;

    // Check if main suggestion contains excluded items
    const titleAndDesc = `${suggestion.title} ${suggestion.description}`.toLowerCase();
    const hasExcluded = excluded.some((item) => titleAndDesc.includes(item));

    if (hasExcluded && suggestion.alternatives.length > 0) {
      // Swap to an alternative that doesn't have excluded items
      const safe = suggestion.alternatives.find((alt) => {
        const altText = `${alt.title} ${alt.description}`.toLowerCase();
        return !excluded.some((item) => altText.includes(item));
      });
      if (safe) {
        return {
          ...suggestion,
          title: safe.title,
          description: safe.description,
        };
      }
    }

    return suggestion;
  }

  private inferType(suggestion: MealSuggestion): string {
    const text = `${suggestion.title} ${suggestion.description}`.toLowerCase();
    if (text.includes("hydrat") || text.includes("water") || text.includes("electrolyte")) return "hydration";
    if (text.includes("recover")) return "recovery";
    if (text.includes("training") || text.includes("workout")) return "training_adjustment";
    return "meal";
  }

  private calculatePriority(activityLevel: string, suggestion: MealSuggestion): number {
    const type = this.inferType(suggestion);
    // Higher activity = higher priority for nutrition
    const activityBonus = activityLevel === "very_active" ? -3 : activityLevel === "active" ? -2 : 0;
    const typeBonus = type === "hydration" ? -1 : type === "recovery" ? -1 : 0;
    return Math.max(1, 5 + activityBonus + typeBonus);
  }

  private pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
