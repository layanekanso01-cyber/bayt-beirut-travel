import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Coffee,
  DollarSign,
  MapPinned,
  Moon,
  Palmtree,
  Sparkles,
  Sun,
  Trees,
  University,
  Wand2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar, Footer } from "@/components/layout";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BudgetLevel,
  ItineraryInterest,
  generateSmartItinerary,
} from "@/lib/smart-itinerary";
import { cn } from "@/lib/utils";

const interestOptions: Array<{
  value: ItineraryInterest;
  label: string;
  icon: typeof Trees;
  helper: string;
}> = [
  { value: "nature", label: "Nature", icon: Trees, helper: "Cedars, valleys, caves" },
  { value: "beaches", label: "Beach", icon: Palmtree, helper: "Coasts and sunset stops" },
  { value: "culture", label: "History", icon: University, helper: "Ruins, castles, old souks" },
  { value: "food", label: "Food", icon: Coffee, helper: "Mezze, cafes, seafood" },
  { value: "nightlife", label: "Nightlife", icon: Moon, helper: "Gemmayze and city evenings" },
];

const builderSteps = [
  { number: 1, label: "Choose mood" },
  { number: 2, label: "Trip length" },
  { number: 3, label: "Your itinerary" },
] as const;

const periodIcons = {
  morning: Sun,
  afternoon: MapPinned,
  evening: Moon,
};

export default function SmartItinerary() {
  const { user } = useAuth();
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState<BudgetLevel>("mid-range");
  const [interests, setInterests] = useState<ItineraryInterest[]>(["culture", "nature"]);
  const [step, setStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState("");

  const itinerary = useMemo(() => {
    return generateSmartItinerary({ days, budget, interests });
  }, [budget, days, interests]);

  function toggleInterest(interest: ItineraryInterest) {
    setInterests((current) => {
      if (current.includes(interest)) {
        return current.length === 1 ? current : current.filter((item) => item !== interest);
      }

      return [...current, interest];
    });
  }

  async function saveItinerary() {
    if (!user) return;

    try {
      const response = await fetch("/api/itineraries/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: `Lebanon ${days}-day ${budget} itinerary`,
          days,
          budget,
          interests,
          totalCost: itinerary.totalCost,
          summary: itinerary.summary,
          planDays: itinerary.days,
        }),
      });

      if (!response.ok) throw new Error("Could not save itinerary");
      setSaveStatus("Itinerary saved to your database.");
    } catch {
      setSaveStatus("Could not save itinerary. Make sure the backend is running.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <Badge variant="secondary" className="mb-4 gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Smart itinerary generator
            </Badge>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                  Generate a Lebanon itinerary in seconds.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Choose your days, budget, and travel interests. The app creates morning, afternoon, and evening plans with travel time estimates.
                </p>
              </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <p className="text-sm text-muted-foreground">Estimated trip cost</p>
              <p className="mt-1 text-4xl font-bold text-foreground">${itinerary.totalCost}</p>
              <p className="mt-2 text-sm text-muted-foreground">{itinerary.summary}</p>
            </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <h2 className="text-2xl font-serif font-bold">Guided trip builder</h2>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {builderSteps.map((builderStep) => {
                  const isActive = step === builderStep.number;
                  const isDone = step > builderStep.number;

                  return (
                    <button
                      key={builderStep.number}
                      type="button"
                      onClick={() => setStep(builderStep.number)}
                      className={cn(
                        "rounded-lg border px-2 py-3 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/5 text-primary"
                          : isDone
                            ? "border-secondary/40 bg-secondary/5 text-secondary"
                            : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : builderStep.number}
                      </span>
                      <span className="block text-xs font-bold">{builderStep.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-5">
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="mb-3 block text-sm font-semibold">Step 1: Choose your travel mood</label>
                    <div className="grid gap-2">
                    {interestOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = interests.includes(option.value);

                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          onClick={() => toggleInterest(option.value)}
                          className="h-auto justify-start rounded-xl p-3 text-left"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>
                            <span className="block font-bold">{option.label}</span>
                            <span className="block text-xs opacity-75">{option.helper}</span>
                          </span>
                        </Button>
                      );
                    })}
                    </div>
                    <Button className="mt-4 w-full rounded-full" onClick={() => setStep(2)}>
                      Continue
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div className="space-y-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                      <label className="mb-2 block text-sm font-semibold">Step 2: Number of days</label>
                      <Input
                        type="number"
                        min={1}
                        max={7}
                        value={days}
                        onChange={(event) => setDays(Number(event.target.value))}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">Budget style</label>
                      <Select value={budget} onValueChange={(value) => setBudget(value as BudgetLevel)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">Budget</SelectItem>
                          <SelectItem value="mid-range">Mid-range</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-full" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button className="rounded-full" onClick={() => setStep(3)}>
                        <Wand2 className="h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-sm font-bold text-secondary">Step 3: Your itinerary is ready</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Built for {days} day{days > 1 ? "s" : ""}, {budget} budget, and {interests.join(", ")}.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-full" onClick={() => setStep(2)}>
                        Edit
                      </Button>
                      <Button className="rounded-full" onClick={saveItinerary}>
                        Save plan
                      </Button>
                      <Button className="rounded-full" onClick={() => window.scrollTo({ top: 360, behavior: "smooth" })}>
                        View plan
                      </Button>
                    </div>
                    {saveStatus && <p className="mt-3 text-xs font-semibold text-muted-foreground">{saveStatus}</p>}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <h2 className="text-xl font-serif font-bold">How it works</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Locations are scored by interest match, budget fit, and best time of day. Travel time is estimated from coordinates using distance and an average road speed.
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            {itinerary.days.map((day) => (
              <section key={day.day} className="rounded-xl border border-border bg-card p-4 shadow-md">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-2xl font-serif font-bold">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      Day {day.day}: {day.theme}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">Estimated day cost: ${day.totalCost}</p>
                  </div>
                  <Badge variant="secondary" className="w-fit gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {budget}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {day.stops.map((stop) => {
                    const Icon = periodIcons[stop.period];

                    return (
                      <article
                        key={`${day.day}-${stop.period}-${stop.location.id}`}
                        className="rounded-lg border border-border bg-background p-4 transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Badge className="capitalize gap-1">
                            <Icon className="h-3.5 w-3.5" />
                            {stop.period}
                          </Badge>
                          <span className="text-sm font-semibold text-primary">${stop.estimatedCost}</span>
                        </div>

                        <h3 className="text-xl font-serif font-bold">{stop.location.name}</h3>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">{stop.location.region}</p>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {stop.location.description}
                        </p>

                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {stop.travelFromPrevious}
                          </p>
                          <p>Visit time: {stop.location.visitDuration}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {stop.location.interests.map((interest) => (
                            <span
                              key={interest}
                              className={cn(
                                "rounded-full px-2 py-1 text-xs font-semibold capitalize",
                                interests.includes(interest)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
