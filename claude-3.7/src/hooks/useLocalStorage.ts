// src/hooks/useLocalStorage.ts
"use client"; // This hook uses browser APIs (localStorage) and useState/useEffect

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// Type for the return value of useLocalStorage
type UseLocalStorageReturn<T> = [T, Dispatch<SetStateAction<T>>, () => void];

/**
 * A custom React hook to manage state that persists in localStorage.
 * @param key The key to use in localStorage.
 * @param initialValue The initial value if nothing is found in localStorage.
 * @returns A stateful value, a function to update it, and a function to remove it from localStorage.
 */
export function useLocalStorage<T>(key: string, initialValue: T): UseLocalStorageReturn<T> {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      // Prevent errors during SSR or build when window is not available
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  // This only runs on the client-side after hydration
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (storedValue === undefined) {
        // If value is undefined, remove item from localStorage (optional behavior)
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the item from localStorage and reset state
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue); // Reset state to initial value
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue, removeValue];
}