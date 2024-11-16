"use client";

import { createContext, useContext, Dispatch, SetStateAction, useState, ReactNode } from "react";

type GlobalContextType = {
  place: SearchResult | null;
  setPlace: Dispatch<SetStateAction<SearchResult | null>>;

}

interface SearchResult {
  properties: {
    id: string;
    name: string;
    label: string;
    country: string;
    region: string;
    locality?: string;
    confidence: number;
  };
  geometry: {
    coordinates: [number, number];
  };
}

const GlobalContext = createContext<GlobalContextType>({
  place: null,
  setPlace: () => {}
});

export const GlobalContextProvider = ({ children } : { children: ReactNode}) => {

  const [place, setPlace] = useState<SearchResult | null>(null);

  return (
    <GlobalContext.Provider value={{
      place,
      setPlace,
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
