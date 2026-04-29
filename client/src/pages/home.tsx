import { useEffect, useState } from "react";
import { Navbar, Footer } from "@/components/layout";
import { Hero } from "@/components/hero";
import { pois, regions } from "@/lib/data";
import { POICard } from "@/components/poi-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { PersonalizedRecommendations } from "@/components/personalized-recommendations";
import { WelcomeExperience } from "@/components/welcome-experience";
import { HiddenGemCard } from "@/components/hidden-gem-card";
import { TravelMoodPicker } from "@/components/travel-mood-picker";

export default function Home() {
  const [featuredLoading, setFeaturedLoading] = useState(true);
  // Get top rated POIs
  const featuredPois = [...pois].sort((a, b) => b.rating - a.rating).slice(0, 3);

  useEffect(() => {
    const timer = window.setTimeout(() => setFeaturedLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <WelcomeExperience />
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        <PersonalizedRecommendations />
        <TravelMoodPicker />
        <HiddenGemCard />
        
        {/* Regions Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
                Explore stays, stories, and regions
              </h2>
              <p className="text-muted-foreground">Image-first guides to Lebanon's most memorable areas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.map((region) => (
              <div key={region.id} className="group relative h-80 cursor-pointer overflow-hidden rounded-3xl shadow-sm ring-1 ring-border/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-primary/20">
                <img 
                  src={region.image} 
                  alt={region.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
                  Lebanon region
                </div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-2xl font-serif font-bold text-white mb-1">{region.name}</h3>
                  <p className="text-white/80 text-sm line-clamp-2 group-hover:text-white transition-colors">
                    {region.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured POIs Section */}
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
                  Top-rated experiences
                </h2>
                <p className="text-muted-foreground">A curated feed of places guests would save first.</p>
              </div>
              <Button variant="outline" className="hidden md:flex" asChild>
                <Link href="/explore">
                  View All <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                      <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                      <Skeleton className="mt-5 h-6 w-3/4" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-2 h-4 w-2/3" />
                      <div className="mt-5 flex justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  ))
                : featuredPois.map((poi) => <POICard key={poi.id} poi={poi} />)}
            </div>
            
            <div className="mt-10 text-center md:hidden">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/explore">
                  View All <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-10 md:p-16 text-center md:text-left relative overflow-hidden">
            {/* Abstract background pattern */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                  Ready to plan your <br/>Lebanese adventure?
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-md">
                  Book tours, reserve tables, and organize your entire trip in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button size="lg" variant="secondary" className="font-semibold" asChild>
                    <Link href="/explore">
                      Plan a Trip
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white">
                    Contact an Expert
                  </Button>
                </div>
              </div>
              <div className="hidden md:block relative h-64">
                {/* Abstract UI mockup illustration would go here - keeping it simple for now */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-full bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                   <div className="h-4 w-1/3 bg-white/20 rounded mb-4" />
                   <div className="h-32 w-full bg-white/10 rounded mb-4" />
                   <div className="h-4 w-2/3 bg-white/20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
