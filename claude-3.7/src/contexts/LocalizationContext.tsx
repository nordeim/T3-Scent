// src/contexts/LocalizationContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { useRouter } // Removed 'usePathname' as it might not be immediately necessary and adds complexity
  from "next/navigation"; // Use from next/navigation for App Router
import { useLocalStorage } from "~/hooks/useLocalStorage"; // Assuming this hook exists
import { toast } from "react-hot-toast";

// Define types for Currency and Language
export type Currency = {
  code: string; // e.g., "USD"
  symbol: string; // e.g., "$"
  name: string; // e.g., "US Dollar"
  // exchangeRate might be fetched dynamically in a real app
  // For simplicity, we can include a base rate if needed, or manage rates elsewhere
  exchangeRateToBase: number; // e.g., 1 for USD (base), 0.93 for EUR if USD is base
};

export type Language = {
  code: string; // e.g., "en"
  name: string; // e.g., "English"
  flag?: string; // Optional: e.g., "🇺🇸"
  // direction?: "ltr" | "rtl"; // Optional for RTL languages
};

// Define the shape of the context data
interface LocalizationContextType {
  language: string;
  setLanguage: (code: string) => void;
  currency: Currency;
  setCurrency: (currencyCode: string) => void;
  formatPrice: (priceInBaseCurrency: number, targetCurrencyCode?: string) => string;
  availableLanguages: Language[];
  availableCurrencies: Currency[];
  translations: Record<string, string>; // Simple key-value for translations
  t: (key: string, params?: Record<string, string | number>) => string; // Translation function
  isLoadingTranslations: boolean;
}

// --- Configuration Data (Ideally, this could come from SiteSettings or an API) ---
const DEFAULT_LANGUAGE_CODE = "en";
const DEFAULT_CURRENCY_CODE = "USD";

const AVAILABLE_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  // Add more languages as needed
];

const AVAILABLE_CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", exchangeRateToBase: 1 },
  { code: "EUR", symbol: "€", name: "Euro", exchangeRateToBase: 0.92 }, // Example rate
  { code: "GBP", symbol: "£", name: "British Pound", exchangeRateToBase: 0.79 }, // Example rate
  // Add more currencies as needed
];
// --- End Configuration Data ---

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
};

interface LocalizationProviderProps {
  children: ReactNode;
  // initialLocale?: string; // Could be passed from server component if detecting user locale
}

export const LocalizationProvider = ({ children }: LocalizationProviderProps) => {
  const router = useRouter();
  // const pathname = usePathname(); // For locale update in URL if using Next.js i18n routing

  const [storedLanguage, setStoredLanguage] = useLocalStorage<string>("appLanguage", DEFAULT_LANGUAGE_CODE);
  const [storedCurrencyCode, setStoredCurrencyCode] = useLocalStorage<string>("appCurrency", DEFAULT_CURRENCY_CODE);

  const [language, setLanguageState] = useState<string>(storedLanguage);
  const [currency, setCurrencyState] = useState<Currency>(
    AVAILABLE_CURRENCIES.find(c => c.code === storedCurrencyCode) || AVAILABLE_CURRENCIES[0]!
  );
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslationsForLang = async (langCode: string) => {
      setIsLoadingTranslations(true);
      try {
        // Simulate fetching translations. In a real app, you'd fetch a JSON file or use an i18n library.
        // e.g., const response = await fetch(`/locales/${langCode}.json`);
        // const data = await response.json();
        let loadedTranslations: Record<string, string> = {};
        // This is a placeholder. Use a proper i18n solution like `next-intl` or `react-i18next`.
        if (langCode === "es") {
          loadedTranslations = { "welcomeMessage": "Bienvenido a The Scent!", "products": "Productos" };
        } else if (langCode === "fr") {
          loadedTranslations = { "welcomeMessage": "Bienvenue à The Scent!", "products": "Produits" };
        } else { // Default (en) or fallback
          loadedTranslations = { "welcomeMessage": "Welcome to The Scent!", "products": "Products" };
        }
        setTranslations(loadedTranslations);
      } catch (error) {
        console.error(`Failed to load translations for ${langCode}:`, error);
        setTranslations({}); // Fallback to empty or default keys
      } finally {
        setIsLoadingTranslations(false);
      }
    };
    loadTranslationsForLang(language).catch(console.error);
  }, [language]);

  const selectLanguage = useCallback((code: string) => {
    const selectedLang = AVAILABLE_LANGUAGES.find(lang => lang.code === code);
    if (selectedLang) {
      setLanguageState(selectedLang.code);
      setStoredLanguage(selectedLang.code);
      // Optional: Update HTML lang attribute
      document.documentElement.lang = selectedLang.code;
      // Optional: If using Next.js built-in i18n routing, navigate to the new locale path
      // router.push(pathname, { locale: selectedLang.code }); // This requires Next.js i18n setup
      toast.success(`Language changed to ${selectedLang.name}`);
    } else {
      console.warn(`Attempted to set unsupported language: ${code}`);
    }
  }, [setStoredLanguage, router /*, pathname (if using for i18n routing) */]);

  const selectCurrency = useCallback((currencyCode: string) => {
    const selectedCurr = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
    if (selectedCurr) {
      setCurrencyState(selectedCurr);
      setStoredCurrencyCode(selectedCurr.code);
      toast.success(`Currency changed to ${selectedCurr.name} (${selectedCurr.symbol})`);
    } else {
      console.warn(`Attempted to set unsupported currency: ${currencyCode}`);
    }
  }, [setStoredCurrencyCode]);

  const formatPrice = useCallback((priceInBaseCurrency: number, targetCurrencyCode?: string): string => {
    const targetCurrency = targetCurrencyCode
      ? AVAILABLE_CURRENCIES.find(c => c.code === targetCurrencyCode) || currency
      : currency;
    
    const convertedPrice = priceInBaseCurrency * targetCurrency.exchangeRateToBase;

    try {
      return new Intl.NumberFormat(language, { // Use current language for formatting locale
        style: 'currency',
        currency: targetCurrency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedPrice);
    } catch (error) {
      console.error("Error formatting price:", error);
      // Fallback formatting
      return `${targetCurrency.symbol}${convertedPrice.toFixed(2)}`;
    }
  }, [currency, language]);

  const translate = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[key] || key; // Fallback to key if translation not found
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    return text;
  }, [translations]);

  const contextValue: LocalizationContextType = {
    language,
    setLanguage: selectLanguage,
    currency,
    setCurrency: selectCurrency,
    formatPrice,
    availableLanguages: AVAILABLE_LANGUAGES,
    availableCurrencies: AVAILABLE_CURRENCIES,
    translations,
    t: translate,
    isLoadingTranslations,
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};