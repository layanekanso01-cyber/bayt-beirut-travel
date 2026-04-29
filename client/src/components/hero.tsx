import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";

const heroImg =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Pigeon%20Rocks%20at%20sunset%2C%20Beirut%2C%20Lebanon.jpg?width=1800";

export function Hero() {
  const [, navigate] = useLocation();
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [mood, setMood] = useState("all");

  function runSearch() {
    const params = new URLSearchParams();
    if (destination.trim()) params.set("q", destination.trim());
    if (mood !== "all") params.set("activity", mood);
    if (travelDate) params.set("date", travelDate);
    navigate(`/explore${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="relative min-h-[88vh] w-full overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <img src={heroImg} alt="Lebanon Coast" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-background/95" />
      </div>

      <div className="relative z-10 container mx-auto flex min-h-[88vh] flex-col justify-center px-4 pb-10 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <span className="mb-6 inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-md">
            Welcome to Lebanon
          </span>
          <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.1] text-white drop-shadow-lg md:text-7xl lg:text-8xl">
            The Pearl of <br />
            <span className="text-secondary italic">the Middle East</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/90 drop-shadow-md md:text-xl">
            Experience a land where ancient history meets modern vibrance. From the snow-capped cedars to the warm
            Mediterranean shores.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="h-14 rounded-full border-none bg-primary px-8 text-base shadow-lg shadow-primary/20 hover:bg-primary/90" asChild>
              <Link href="/explore">
                Start Exploring <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-white/40 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:border-white hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link href="/explore?view=map">
                <MapPin className="mr-2 h-5 w-5" /> View Map
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
          className="mt-12 max-w-5xl rounded-[2rem] border border-white/45 bg-white p-2 shadow-2xl shadow-black/20 md:rounded-full"
        >
          <div className="grid gap-1 md:grid-cols-[1.25fr_1fr_1fr_auto] md:items-center">
            <label className="rounded-full px-5 py-4 transition-colors hover:bg-muted">
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-foreground">Where</span>
              <span className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runSearch();
                  }}
                  placeholder="Beirut, Cedars, Byblos"
                  className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                />
              </span>
            </label>

            <label className="rounded-full px-5 py-4 transition-colors hover:bg-muted">
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-foreground">When</span>
              <span className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                <input
                  type="date"
                  value={travelDate}
                  onChange={(event) => setTravelDate(event.target.value)}
                  className="w-full bg-transparent text-foreground outline-none"
                />
              </span>
            </label>

            <label className="rounded-full px-5 py-4 transition-colors hover:bg-muted">
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-foreground">Mood</span>
              <span className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <select
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                  className="w-full bg-transparent text-foreground outline-none"
                >
                  <option value="all">Any mood</option>
                  <option value="nature">Nature</option>
                  <option value="beaches">Beach</option>
                  <option value="culture">History</option>
                  <option value="food">Food</option>
                  <option value="nightlife">Nightlife</option>
                </select>
              </span>
            </label>

            <Button type="button" className="h-14 rounded-full px-6" onClick={runSearch}>
              <Search className="h-5 w-5" />
              Search
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
