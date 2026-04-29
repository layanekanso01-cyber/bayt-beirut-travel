import { POI, regions } from "@/lib/data";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface POICardProps {
  poi: POI;
}

function getRegionName(regionId: number) {
  return regions.find((region) => region.id === regionId)?.name ?? "Lebanon";
}

export function POICard({ poi }: POICardProps) {
  const priceLabel =
    poi.type === "spot"
      ? poi.entranceFee
        ? `$${poi.entranceFee} entry`
        : "Free entry"
      : poi.type === "restaurant"
        ? `Avg. $${poi.averagePrice}`
        : poi.priceRange;

  return (
    <Link href={`/poi/${poi.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="h-full"
      >
        <Card className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border-none bg-card shadow-sm ring-1 ring-border/70 transition-all duration-300 hover:shadow-2xl hover:ring-primary/20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
            <img 
              src={poi.image} 
              alt={poi.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 pb-3 opacity-90">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className={`h-1.5 rounded-full bg-white ${dot === 0 ? "w-5" : "w-1.5 opacity-70"}`} />
              ))}
            </div>
            <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur transition-transform group-hover:scale-110">
              <Heart className="h-5 w-5" />
            </div>
            <div className="absolute left-3 top-3">
              <Badge variant={poi.type === 'spot' ? 'default' : poi.type === 'restaurant' ? 'secondary' : 'outline'} className="rounded-full capitalize shadow-sm">
                {poi.type}
              </Badge>
            </div>
          </div>
          
          <CardContent className="flex-1 p-4">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                {poi.name}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                {poi.rating}
              </span>
            </div>
            
            <p className="mb-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {poi.description}
            </p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{getRegionName(poi.regionId)}</span>
            </div>
          </CardContent>
          
          <CardFooter className="mt-auto flex items-center justify-between border-t border-border/40 p-4 pt-3 text-sm">
            <span className="font-bold text-foreground">{priceLabel}</span>
            <span className="text-xs font-semibold text-primary">View details</span>
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
}
