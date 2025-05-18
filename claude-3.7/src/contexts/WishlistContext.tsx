// src/contexts/WishlistContext.tsx
"use client";

import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    type ReactNode, 
    useCallback,
    useMemo // ADDED useMemo here
} from 'react';
import { toast } from 'react-hot-toast';
import { api } from '~/trpc/react'; // Corrected: Use api from trpc/react for client components
import { useSession } from 'next-auth/react';
import { useLocalStorage } from '~/hooks/useLocalStorage';

// Define the shape of a wishlist item
export interface WishlistItemClient {
  id: string; // Product ID
  variantId?: string | null; 
  name: string;
  price: number;
  imageUrl?: string | null;
  slug: string; 
}

interface WishlistContextType {
  items: WishlistItemClient[];
  addToWishlist: (item: WishlistItemClient) => void;
  removeFromWishlist: (productId: string, variantId?: string | null) => void;
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
  clearWishlist: () => void; 
  isLoading: boolean; 
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

const WISHLIST_STORAGE_KEY = "the-scent-wishlist";

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const { data: session, status: sessionStatus } = useSession();
  const [localItems, setLocalItems] = useLocalStorage<WishlistItemClient[]>(WISHLIST_STORAGE_KEY, []);
  const [syncedItems, setSyncedItems] = useState<WishlistItemClient[]>([]); 
  const [isLoadingInitialDB, setIsLoadingInitialDB] = useState(true); 

  const getWishlistQuery = api.wishlist.getWishlist.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      const mappedData = data.map(item => ({
        id: item.product.id,
        variantId: item.variantId, 
        name: item.product.name,
        price: parseFloat(item.product.price.toString()), 
        imageUrl: item.product.images?.[0]?.url ?? undefined,
        slug: item.product.slug,
      }));
      setSyncedItems(mappedData);
      setIsLoadingInitialDB(false);
    },
    onError: () => {
        setIsLoadingInitialDB(false);
        toast.error("Could not load wishlist from server.");
    }
  });

  const addItemMutation = api.wishlist.addToWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to add to wishlist: ${error.message}`); }
  });
  const removeItemMutation = api.wishlist.removeFromWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to remove from wishlist: ${error.message}`); }
  });
  const clearWishlistMutation = api.wishlist.clearWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to clear wishlist: ${error.message}`); }
  });

  const items = useMemo(() => {
    return sessionStatus === "authenticated" ? syncedItems : localItems;
  }, [sessionStatus, localItems, syncedItems]);

  // Sync local to DB on login (basic version: add local items not in DB)
  useEffect(() => {
    if (sessionStatus === "authenticated" && !isLoadingInitialDB && localItems.length > 0) {
      const dbItemKeys = new Set(syncedItems.map(item => `${item.id}-${item.variantId ?? 'null'}`));
      const itemsToSync = localItems.filter(localItem => !dbItemKeys.has(`${localItem.id}-${localItem.variantId ?? 'null'}`));
      
      if (itemsToSync.length > 0) {
        Promise.all(itemsToSync.map(item => addItemMutation.mutateAsync({ productId: item.id, variantId: item.variantId })))
          .then(() => {
            console.log("Local wishlist items synced to DB.");
            setLocalItems([]); // Clear local items after successful sync
          })
          .catch(error => console.error("Error syncing local wishlist to DB:", error));
      } else {
        // If no items to sync from local, but local had items, it means they were already on server or cleared.
        // If user explicitly cleared local before login, this is fine.
        // If local was just old, this is also fine.
      }
    }
  }, [sessionStatus, isLoadingInitialDB, localItems, syncedItems, addItemMutation, setLocalItems]);


  const addToWishlist = useCallback((item: WishlistItemClient) => {
    const alreadyExists = items.some(i => i.id === item.id && i.variantId === item.variantId);
    if (alreadyExists) {
        toast.info(`${item.name} is already in your wishlist.`);
        return;
    }

    if (sessionStatus === "authenticated" && session?.user) {
      addItemMutation.mutate({ productId: item.id, variantId: item.variantId });
    } else {
      setLocalItems(prev => [...prev, item]);
    }
    toast.success(`${item.name} added to wishlist!`);
  }, [sessionStatus, session, addItemMutation, setLocalItems, items]);

  const removeFromWishlist = useCallback((productId: string, variantId?: string | null) => {
    const itemToRemove = items.find(item => item.id === productId && item.variantId === (variantId ?? undefined));
    
    if (sessionStatus === "authenticated" && session?.user) {
      removeItemMutation.mutate({ productId, variantId: variantId ?? undefined });
    } else {
      setLocalItems(prev => prev.filter(i => !(i.id === productId && i.variantId === (variantId ?? undefined))));
    }
    if (itemToRemove) {
      toast.success(`${itemToRemove.name} removed from wishlist.`);
    }
  }, [sessionStatus, session, removeItemMutation, setLocalItems, items]);

  const isInWishlist = useCallback((productId: string, variantId?: string | null): boolean => {
    return items.some(item => item.id === productId && item.variantId === (variantId ?? undefined));
  }, [items]);

  const clearWishlist = useCallback(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      clearWishlistMutation.mutate();
    } else {
      setLocalItems([]);
    }
    toast.success("Wishlist cleared.");
  }, [sessionStatus, session, clearWishlistMutation, setLocalItems]);

  const isLoadingOverall = sessionStatus === "loading" || isLoadingInitialDB || addItemMutation.isPending || removeItemMutation.isPending || clearWishlistMutation.isPending;

  return (
    <WishlistContext.Provider value={{ 
        items, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist, 
        clearWishlist,
        isLoading: isLoadingOverall,
        itemCount: items.length 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};