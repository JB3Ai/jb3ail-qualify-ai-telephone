import React, { createContext, useContext, useState, useEffect } from 'react';

interface TerminalState {
  showTicker: boolean;
  toggleTicker: () => void;
}

const TerminalContext = createContext<TerminalState | undefined>(undefined);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTicker, setShowTicker] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('os3_ticker_enabled');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('os3_ticker_enabled', String(showTicker));
  }, [showTicker]);

  const toggleTicker = () => setShowTicker((prev) => !prev);

  return (
    <TerminalContext.Provider value={{ showTicker, toggleTicker }}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
