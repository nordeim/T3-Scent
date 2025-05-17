// src/contexts/WishlistContext.tsx
"use client";

import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    type ReactNode, 
    useCallback 
} from 'react';
import { toast } from 'react-hot-toast';
import { api } from '~/utils/api'; // For tRPC calls
import { useSession } from 'next-auth/react';
import { useLocalStorage } from '~/hooks/useLocalStorage'; // Assuming this hook

// Define the shape of a wishlist item
export interface WishlistItemClient {
  id: string; // Product ID
  variantId?: string | null; // Optional: ProductVariant ID
  name: string;
  price: number;
  imageUrl?: string | null;
  slug: string; // For linking
  // Potentially add addedAt client-side if not syncing immediately
}

interface WishlistContextType {
  items: WishlistItemClient[];
  addToWishlist: (item: WishlistItemClient) => void;
  removeFromWishlist: (productId: string, variantId?: string | null) => void;
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
  clearWishlist: () => void; // Clear local and potentially remote wishlist
  isLoading: boolean; // For async operations like syncing with backend
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
  const [syncedItems, setSyncedItems] = useState<WishlistItemClient[]>([]); // Items from DB for logged-in user
  const [isLoading, setIsLoading] = useState(true); // Initial loading state

  // tRPC queries/mutations
  const { data: dbWishlist, refetch: refetchDbWishlist, isLoading: isLoadingDbWishlist } = 
    api.wishlist.getWishlist.useQuery(undefined, {
      enabled: sessionStatus === "authenticated",
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        const mappedData = data.map(item => ({
          id: item.product.id,
          variantId: item.variantId, // Ensure your getWishlist returns variantId
          name: item.product.name,
          // Ensure price and imageUrl are correctly mapped from Product or ProductVariant
          price: parseFloat(item.product.price.toString()), // Example, adapt to your actual data structure
          imageUrl: item.product.images?.[0]?.url ?? undefined,
          slug: item.product.slug,
        }));
        setSyncedItems(mappedData);
      }
    });

  const addItemMutation = api.wishlist.addToWishlist.useMutation({
    onSuccess: () => { refetchDbWishlist().catch(console.error); },
    onError: (error) => { toast.error(`Failed to add to wishlist: ${error.message}`); }
  });
  const removeItemMutation = api.wishlist.removeFromWishlist.useMutation({
    onSuccess: () => { refetchDbWishlist().catch(console.error); },
    onError: (error) => { toast.error(`Failed to remove from wishlist: ${error.message}`); }
  });
  const clearWishlistMutation = api.wishlist.clearWishlist.useMutation({
    onSuccess: () => { refetchDbWishlist().catch(console.error); },
    onError: (error) => { toast.error(`Failed to clear wishlist: ${error.message}`); }
  });

  // Determine current items based on session status
  const items = useMemo(() => {
    return sessionStatus === "authenticated" ? syncedItems : localItems;
  }, [sessionStatus, localItems, syncedItems]);

  // Effect for initial load and syncing when session status changes
  useEffect(() => {
    setIsLoading(sessionStatus === "loading" || (sessionStatus === "authenticated" && isLoadingDbWishlist));
    if (sessionStatus === "authenticated" && !isLoadingDbWishlist) {
      // Optional: Merge local wishlist with DB wishlist on login
      // This logic can be complex (e.g., if local items are newer or conflict)
      // For simplicity, current setup prioritizes DB wishlist on login.
      // If localItems has items not in dbWishlist, you could offer to sync them.
    }
  }, [sessionStatus, isLoadingDbWishlist]);

  const addToWishlist = useCallback((item: WishlistItemClient) => {
    if (sessionStatus === "authenticated" && session?.user) {
      addItemMutation.mutate({ productId: item.id, variantId: item.variantId });
    } else {
      setLocalItems(prev => {
        if (prev.find(i => i.id === item.id && i.variantId === item.variantId)) return prev; // Already exists
        return [...prev, item];
      });
    }
    toast.success(`${item.name} added to wishlist!`);
  }, [sessionStatus, session, addItemMutation, setLocalItems]);

  const removeFromWishlist = useCallback((productId: string, variantId?: string | null) => {
    const itemIdentifier = { productId, variantId: variantId ?? undefined };
    if (sessionStatus === "authenticated" && session?.user) {
      removeItemMutation.mutate(itemIdentifier);
    } else {
      setLocalItems(prev => prev.filter(i => !(i.id === productId && i.variantId === (variantId ?? undefined))));
    }
    // Toast after mutation success or local update
  }, [sessionStatus, session, removeItemMutation, setLocalItems]);

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

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{ 
        items, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist, 
        clearWishlist,
        isLoading: isLoading || addItemMutation.isPending || removeItemMutation.isPending || clearWishlistMutation.isPending,
        itemCount 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};