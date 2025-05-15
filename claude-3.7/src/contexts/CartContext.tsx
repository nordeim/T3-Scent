// src/contexts/CartContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { toast } from "react-hot-toast"; // For user feedback

export interface CartItem {
  id: string; // Product ID
  variantId?: string | null; // ProductVariant ID
  name: string;
  price: number; // Price of the item (considering variant if applicable)
  imageUrl?: string | null;
  quantity: number;
  variantName?: string; // e.g., "Size L, Color Red"
  // Potentially add slug for linking back to product page easily
  slug?: string; 
}

interface CartContextType {
  items: CartItem[];
  addItem: (itemToAdd: Omit<CartItem, 'quantity'> & { quantity?: number }) => void; // Allow adding with specific quantity
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getItem: (productId: string, variantId?: string | null) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = "the-scent-cart";

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // To prevent hydration issues

  // Load cart from localStorage on initial client-side render
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        // Basic validation for parsed cart items
        if (Array.isArray(parsedCart) && parsedCart.every(item => typeof item.id === 'string' && typeof item.quantity === 'number')) {
            setItems(parsedCart);
        } else {
            localStorage.removeItem(CART_STORAGE_KEY); // Clear invalid cart
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
        localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted cart
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes, only if initialized
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = useCallback((itemToAdd: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      const quantityToAdd = itemToAdd.quantity ?? 1;
      const existingItemIndex = prevItems.findIndex(
        (i) => i.id === itemToAdd.id && i.variantId === itemToAdd.variantId
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex]!;
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantityToAdd,
        };
        toast.success(`${itemToAdd.name} quantity updated in cart!`);
        return updatedItems;
      } else {
        toast.success(`${itemToAdd.name} added to cart!`);
        return [...prevItems, { ...itemToAdd, quantity: quantityToAdd }];
      }
    });
    openCart(); // Open cart sidebar/modal on add
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string | null) => {
    setItems((prevItems) => {
      const itemToRemove = prevItems.find(item => item.id === productId && item.variantId === variantId);
      if (itemToRemove) {
        toast.error(`${itemToRemove.name} removed from cart.`);
      }
      return prevItems.filter(
        (item) => !(item.id === productId && item.variantId === variantId)
      );
    });
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | null | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
    // toast.info(`Quantity updated.`); // Can be a bit noisy
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.success("Cart cleared!");
  }, []);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const getItem = useCallback((productId: string, variantId?: string | null) => {
    return items.find(item => item.id === productId && item.variantId === (variantId ?? undefined));
  }, [items]);


  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        isCartOpen,
        toggleCart,
        openCart,
        closeCart,
        getItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};