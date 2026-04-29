import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { scopedStorageKey } from "@/lib/user-scope";

export type FavoriteCollection = {
  id: string;
  name: string;
  poiIds: number[];
  createdAt: string;
};

const baseStorageKey = "lebanon-tourism-favorite-collections";

const defaultCollections: FavoriteCollection[] = [
  {
    id: "default",
    name: "Saved Places",
    poiIds: [],
    createdAt: new Date().toISOString(),
  },
];

function readCollections(storageKey: string) {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return defaultCollections;

    const parsed = JSON.parse(value) as FavoriteCollection[];
    return parsed.length > 0 ? parsed : defaultCollections;
  } catch {
    return defaultCollections;
  }
}

export function useFavoriteCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<FavoriteCollection[]>([]);

  useEffect(() => {
    if (!user) {
      setCollections(defaultCollections);
      return;
    }

    let isMounted = true;
    const storageKey = scopedStorageKey(user, baseStorageKey);
    setCollections(readCollections(storageKey));

    fetch(`/api/favorites/collections?userId=${encodeURIComponent(user.id)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load favorites");
        return response.json();
      })
      .then((data: FavoriteCollection[]) => {
        if (isMounted && Array.isArray(data)) setCollections(data);
      })
      .catch(() => {
        if (isMounted) setCollections(readCollections(storageKey));
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (user && collections.length > 0) {
      window.localStorage.setItem(scopedStorageKey(user, baseStorageKey), JSON.stringify(collections));
    }
  }, [collections, user]);

  const savedPoiIds = useMemo(() => {
    return new Set(collections.flatMap((collection) => collection.poiIds));
  }, [collections]);

  function createCollection(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName || !user) return;

    const fallbackCollection = {
      id: `collection-${Date.now()}`,
      name: trimmedName,
      poiIds: [],
      createdAt: new Date().toISOString(),
    };

    fetch("/api/favorites/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, userId: user.id }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not create collection");
        return response.json();
      })
      .then((collection: FavoriteCollection) => setCollections((current) => [...current, collection]))
      .catch(() => setCollections((current) => [...current, fallbackCollection]));
  }

  function deleteCollection(collectionId: string) {
    if (!user) return;
    setCollections((current) => current.filter((collection) => collection.id !== collectionId));
    fetch(`/api/favorites/collections/${collectionId}?userId=${encodeURIComponent(user.id)}`, {
      method: "DELETE",
    }).catch(() => undefined);
  }

  function addPlace(collectionId: string, poiId: number) {
    if (!user) return;
    setCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId || collection.poiIds.includes(poiId)) return collection;
        return { ...collection, poiIds: [...collection.poiIds, poiId] };
      })
    );

    fetch(`/api/favorites/collections/${collectionId}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiId, userId: user.id }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not save place");
        return response.json();
      })
      .then((collection: FavoriteCollection) => {
        if (collection) {
          setCollections((current) => current.map((item) => (item.id === collection.id ? collection : item)));
        }
      })
      .catch(() => undefined);
  }

  function removePlace(collectionId: string, poiId: number) {
    if (!user) return;
    setCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId) return collection;
        return { ...collection, poiIds: collection.poiIds.filter((id) => id !== poiId) };
      })
    );

    fetch(`/api/favorites/collections/${collectionId}/places/${poiId}?userId=${encodeURIComponent(user.id)}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not remove place");
        return response.json();
      })
      .then((collection: FavoriteCollection) => {
        if (collection) {
          setCollections((current) => current.map((item) => (item.id === collection.id ? collection : item)));
        }
      })
      .catch(() => undefined);
  }

  return {
    collections,
    savedPoiIds,
    createCollection,
    deleteCollection,
    addPlace,
    removePlace,
  };
}
