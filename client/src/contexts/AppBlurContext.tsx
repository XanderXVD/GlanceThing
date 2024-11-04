import React, { createContext, useState } from "react";

// Definieert het type voor de blur-context waarden
interface AppBlurContextProps {
  blurred: boolean;
  setBlurred: (blurred: boolean) => void;
}

// Maakt een context aan met standaardwaarden
const AppBlurContext = createContext<AppBlurContextProps>({
  blurred: false,
  setBlurred: () => {},
});

// Type voor de eigenschappen van de contextprovider
interface AppBlurContextProviderProps {
  children: React.ReactNode;
}

// De provider-component die de blur-context levert aan de componenten binnen deze context
const AppBlurContextProvider = ({ children }: AppBlurContextProviderProps) => {
  const [blurred, setBlurred] = useState(false);

  return (
    <AppBlurContext.Provider
      value={{
        blurred,
        setBlurred,
      }}
    >
      {children}
    </AppBlurContext.Provider>
  );
};

export { AppBlurContext, AppBlurContextProvider };
