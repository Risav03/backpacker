"use client";

import { createContext, useContext, Dispatch, SetStateAction, useState, ReactNode } from "react";

type GlobalContextType = {
  place: string | null;
  setPlace: Dispatch<SetStateAction<string | null>>;

}

const GlobalContext = createContext<GlobalContextType>({
  place: null,
  setPlace: () => {}
});

export const GlobalContextProvider = ({ children } : { children: ReactNode}) => {

  const [place, setPlace] = useState<string | null>(null);

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
