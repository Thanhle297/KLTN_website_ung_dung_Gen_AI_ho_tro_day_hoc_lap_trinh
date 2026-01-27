import { createContext, useState } from "react";

export const HeaderContext = createContext();

export const HeaderProvider = ({ children }) => {
  const [showHeader, setShowHeader] = useState(true);

  return (
    <HeaderContext.Provider value={{ showHeader, setShowHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};
