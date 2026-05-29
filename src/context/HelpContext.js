import React, { createContext, useContext, useState } from 'react';

const HelpContext = createContext({
  showHelp: false,
  setShowHelp: () => {},
});

export function HelpProvider({ children }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <HelpContext.Provider value={{ showHelp, setShowHelp }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}
