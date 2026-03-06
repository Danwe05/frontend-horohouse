"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import apiClient from "@/lib/api";

interface FavoritesContextValue {
  favorites: Set<string>;
  isLoaded: boolean;
  isFavorite: (id: string) => boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: new Set(),
  isLoaded: false,
  isFavorite: () => false,
  addFavorite: () => {},
  removeFavorite: () => {},
  refetch: async () => {},
});

export const useFavorites = () => useContext(FavoritesContext);

interface FavoritesProviderProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export const FavoritesProvider = ({
  children,
  isAuthenticated,
}: FavoritesProviderProps) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const fetchedRef = useRef(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites(new Set());
      setIsLoaded(true);
      return;
    }
    try {
      const data = await apiClient.getFavorites();
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data?.favorites)) items = data.favorites;
      else if (Array.isArray(data?.data?.favorites)) items = data.data.favorites;
      else if (Array.isArray(data?.data)) items = data.data;

      const ids = new Set<string>();
      items.forEach((item: any) => {
        if (!item) return;
        if (typeof item === "string") ids.add(item);
        else if (typeof item === "object") {
          if (item.propertyId) ids.add(item.propertyId);
          else if (item.property?._id || item.property?.id)
            ids.add(item.property._id || item.property.id);
          else if (item._id || item.id) ids.add(item._id || item.id);
        }
      });
      setFavorites(ids);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
      setFavorites(new Set());
    } finally {
      setIsLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchFavorites();
    }
  }, [fetchFavorites]);

  // Reset when auth changes
  useEffect(() => {
    fetchedRef.current = false;
    setIsLoaded(false);
    fetchFavorites();
    fetchedRef.current = true;
  }, [isAuthenticated]);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  const addFavorite = useCallback((id: string) => {
    setFavorites((prev) => new Set([...prev, id]));
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoaded,
        isFavorite,
        addFavorite,
        removeFavorite,
        refetch: fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};