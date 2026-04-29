import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pois, regions, type POI } from "@/lib/data";

function getRegionName(poi: POI) {
  return regions.find((region) => region.id === poi.regionId)?.name ?? "Lebanon";
}

function getRandomGem(currentId?: number) {
  const hiddenGems = pois.filter((poi) => poi.type === "spot");
  const options = currentId ? hiddenGems.filter((poi) => poi.id !== currentId) : hiddenGems;
  return options[Math.floor(Math.random() * options.length)] ?? hiddenGems[0];
}

export function HiddenGemCard() {
  const firstGem = useMemo(() => getRandomGem(), []);
  const [gem, setGem] = useState(firstGem);
  const [isRevealed, setIsRevealed] = useState(false);

  function revealGem() {
    if (isRevealed) return;
    setIsRevealed(true);
  }

  function discoverAnother() {
    setGem(getRandomGem(gem.id));
    setIsRevealed(false);
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid items-center gap-8 rounded-3xl border border-border bg-card p-5 shadow-xl md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <Badge variant="secondary" className="mb-4 gap-2">
            <Sparkles className="h-4 w-4" />
            Discover a Hidden Gem
          </Badge>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Scratch the card to reveal a Lebanese destination.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Feeling spontaneous? Reveal a random place and add a little surprise to your trip plan.
          </p>
        </div>

        <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-border bg-muted">
          <img
            src={gem.image}
            alt={gem.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          <motion.div
            className="absolute inset-x-0 bottom-0 z-10 p-6 text-white"
            initial={false}
            animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 18 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <Badge className="mb-3 bg-white text-foreground hover:bg-white">{getRegionName(gem)}</Badge>
            <h3 className="font-serif text-3xl font-bold">{gem.name}</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">{gem.description}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href={`/poi/${gem.id}`}>
                  Open details <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/45 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={discoverAnother}
              >
                Shuffle again
              </Button>
            </div>
          </motion.div>

          {!isRevealed && (
            <motion.button
              type="button"
              className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--card))_48%,hsl(var(--secondary))_100%)] p-6 text-center"
              onClick={revealGem}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              aria-label="Reveal hidden destination"
            >
              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0_2px,transparent_3px),radial-gradient(circle_at_70%_35%,white_0_2px,transparent_3px),radial-gradient(circle_at_45%_75%,white_0_2px,transparent_3px)] [background-size:42px_42px]" />
              <motion.div
                className="absolute -left-24 top-0 h-full w-20 rotate-12 bg-white/35 blur-xl"
                animate={{ x: ["0vw", "130vw"] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary shadow-2xl">
                <Sparkles className="h-9 w-9" />
              </div>
              <p className="relative mt-6 text-sm font-bold uppercase tracking-[0.24em] text-foreground/70">
                Tap to reveal
              </p>
              <h3 className="relative mt-3 font-serif text-4xl font-black text-foreground">
                Hidden Gem
              </h3>
              <p className="relative mt-3 max-w-sm text-sm leading-6 text-foreground/70">
                Your surprise Lebanese destination is waiting underneath.
              </p>
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
