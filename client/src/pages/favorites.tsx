import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { FolderHeart, Heart, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POI, pois, regions } from "@/lib/data";
import { useFavoriteCollections } from "@/hooks/use-favorite-collections";

function getRegionName(poi: POI) {
  return regions.find((region) => region.id === poi.regionId)?.name ?? "Lebanon";
}

export default function Favorites() {
  const {
    collections,
    savedPoiIds,
    createCollection,
    deleteCollection,
    addPlace,
    removePlace,
  } = useFavoriteCollections();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("default");
  const [selectedPoiId, setSelectedPoiId] = useState(pois[0]?.id.toString() ?? "");

  useEffect(() => {
    if (collections.length > 0 && !collections.some((collection) => collection.id === selectedCollectionId)) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const unsavedPois = useMemo(() => {
    return pois.filter((poi) => !savedPoiIds.has(poi.id));
  }, [savedPoiIds]);

  function handleCreateCollection() {
    createCollection(newCollectionName);
    setNewCollectionName("");
  }

  function handleAddPlace() {
    const poiId = Number(selectedPoiId);
    if (!selectedCollectionId || !poiId) return;
    addPlace(selectedCollectionId, poiId);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-14">
          <div className="container mx-auto px-4">
            <Badge variant="secondary" className="mb-4 gap-2">
              <FolderHeart className="h-3.5 w-3.5" />
              Saved collections
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Save places for your Lebanon trips.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Create collections like My Summer Trip, add places, and keep your favorite attractions organized.
            </p>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <h2 className="text-2xl font-serif font-bold">Create collection</h2>
              <div className="mt-4 flex gap-2">
                <Input
                  value={newCollectionName}
                  onChange={(event) => setNewCollectionName(event.target.value)}
                  placeholder="My Summer Trip"
                />
                <Button type="button" size="icon" onClick={handleCreateCollection}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <h2 className="text-2xl font-serif font-bold">Save a place</h2>
              <div className="mt-4 space-y-3">
                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPoiId} onValueChange={setSelectedPoiId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Place" />
                  </SelectTrigger>
                  <SelectContent>
                    {(unsavedPois.length > 0 ? unsavedPois : pois).map((poi) => (
                      <SelectItem key={poi.id} value={poi.id.toString()}>
                        {poi.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="button" className="w-full" onClick={handleAddPlace}>
                  <Heart className="h-4 w-4" />
                  Save place
                </Button>
              </div>
            </div>
          </aside>

          <div className="rounded-xl border border-border bg-card p-4 shadow-md">
            {collections.length > 0 ? (
              <Tabs value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 bg-muted/50 p-2">
                  {collections.map((collection) => (
                    <TabsTrigger key={collection.id} value={collection.id}>
                      {collection.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {collections.map((collection) => {
                  const savedPois = collection.poiIds
                    .map((poiId) => pois.find((poi) => poi.id === poiId))
                    .filter((poi): poi is POI => Boolean(poi));

                  return (
                    <TabsContent key={collection.id} value={collection.id}>
                      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-2xl font-serif font-bold">{collection.name}</h2>
                          <p className="text-sm text-muted-foreground">{savedPois.length} saved places</p>
                        </div>
                        {collection.name !== "Saved Places" && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => deleteCollection(collection.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete collection
                          </Button>
                        )}
                      </div>

                      {savedPois.length > 0 ? (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {savedPois.map((poi) => (
                            <article
                              key={poi.id}
                              className="overflow-hidden rounded-xl border border-border bg-background shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                            >
                              <div className="relative h-44 overflow-hidden">
                                <img
                                  src={poi.image}
                                  alt={poi.name}
                                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                                />
                                <div className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-bold shadow-sm">
                                  <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  {poi.rating}
                                </div>
                              </div>
                              <div className="p-4">
                                <h3 className="text-xl font-serif font-bold">{poi.name}</h3>
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                                  {poi.description}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Badge variant="outline" className="gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {getRegionName(poi)}
                                  </Badge>
                                  {(poi.activities ?? []).slice(0, 2).map((activity) => (
                                    <Badge key={activity} variant="secondary" className="capitalize">
                                      {activity}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="mt-5 flex gap-2">
                                  <Button asChild size="sm" className="flex-1">
                                    <Link href={`/poi/${poi.id}`}>View</Link>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => removePlace(collection.id, poi.id)}
                                    aria-label={`Remove ${poi.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border p-10 text-center">
                          <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
                          <h3 className="mt-4 text-xl font-serif font-bold">No places saved yet</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Use the save form to add your first Lebanon destination.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              <div className="p-10 text-center text-muted-foreground">Create a collection to get started.</div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
