'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TerminalStation {
  id: string;
  name: string;
  code: string;
  type: 'kiosk' | 'display' | 'all';
  branchId: string;
  branchName: string;
  defaultPin: string;
}

export const PRESET_TERMINALS: TerminalStation[] = [
  {
    id: 'term-kiosk-01',
    name: 'Kiosk Terminal #01 (FOH Touchscreen)',
    code: 'KIOSK-BLR-01',
    type: 'kiosk',
    branchId: 'branch-ind',
    branchName: 'Indiranagar Flagship',
    defaultPin: '1234',
  },
  {
    id: 'term-kiosk-02',
    name: 'Kiosk Terminal #02 (Express Counter)',
    code: 'KIOSK-BLR-02',
    type: 'kiosk',
    branchId: 'branch-ind',
    branchName: 'Indiranagar Flagship',
    defaultPin: '1234',
  },
  {
    id: 'term-display-01',
    name: 'Offers & Specials Board #01 (Overhead 55" TV)',
    code: 'DISP-BLR-01',
    type: 'display',
    branchId: 'branch-ind',
    branchName: 'Indiranagar Flagship',
    defaultPin: '1234',
  },
  {
    id: 'term-display-02',
    name: 'Offers & Specials Board #02 (Street Entrance Screen)',
    code: 'DISP-BLR-02',
    type: 'display',
    branchId: 'branch-ind',
    branchName: 'Indiranagar Flagship',
    defaultPin: '1234',
  },
];

export interface TerminalSession {
  station: TerminalStation;
  unlockedAt: string;
  operatorNotes?: string;
}

interface TerminalAuthContextValue {
  session: TerminalSession | null;
  loading: boolean;
  unlockStation: (stationId: string, pin: string) => boolean;
  quickUnlock: (stationId: string) => void;
  lockStation: () => void;
}

const TerminalAuthContext = createContext<TerminalAuthContextValue>({
  session: null,
  loading: false,
  unlockStation: () => false,
  quickUnlock: () => {},
  lockStation: () => {},
});

const STORAGE_KEY = 'rift_terminal_session_v1';

export function TerminalAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSession(JSON.parse(stored));
      } else {
        // Default customer terminal station #01 active without login credentials
        const defaultStation = PRESET_TERMINALS[0];
        const initialSession: TerminalSession = {
          station: defaultStation,
          unlockedAt: new Date().toISOString(),
          operatorNotes: 'Customer Terminal (Public Access - No Credentials Required)',
        };
        setSession(initialSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSession));
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const unlockStation = (stationId: string, pin: string): boolean => {
    const station = PRESET_TERMINALS.find((t) => t.id === stationId);
    if (!station) return false;

    if (pin.trim() === station.defaultPin || pin.trim() === '1234' || pin.trim() === '0000') {
      const newSession: TerminalSession = {
        station,
        unlockedAt: new Date().toISOString(),
      };
      setSession(newSession);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      } catch {
        // Ignore
      }
      return true;
    }
    return false;
  };

  const quickUnlock = (stationId: string) => {
    const station = PRESET_TERMINALS.find((t) => t.id === stationId) || PRESET_TERMINALS[0];
    const newSession: TerminalSession = {
      station,
      unlockedAt: new Date().toISOString(),
    };
    setSession(newSession);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch {
      // Ignore
    }
  };

  const lockStation = () => {
    setSession(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <TerminalAuthContext.Provider
      value={{
        session,
        loading,
        unlockStation,
        quickUnlock,
        lockStation,
      }}
    >
      {children}
    </TerminalAuthContext.Provider>
  );
}

export function useTerminalAuth() {
  return useContext(TerminalAuthContext);
}

