import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Meal, NutritionAnalysis } from "@workspace/api-client-react";

type AppContextType = {
  pendingAnalysis: NutritionAnalysis | null;
  setPendingAnalysis: (a: NutritionAnalysis | null) => void;
  pendingImageBase64: string | null;
  setPendingImageBase64: (s: string | null) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  editingMeal: Meal | null;
  setEditingMeal: (m: Meal | null) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const today = new Date().toISOString().split("T")[0];
  const [pendingAnalysis, setPendingAnalysis] = useState<NutritionAnalysis | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  return (
    <AppContext.Provider
      value={{
        pendingAnalysis,
        setPendingAnalysis,
        pendingImageBase64,
        setPendingImageBase64,
        selectedDate,
        setSelectedDate,
        editingMeal,
        setEditingMeal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
