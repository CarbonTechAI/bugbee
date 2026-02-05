'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userId: string;
  setUserId: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState('');
  const [userId, setUserIdState] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('bugbee_username');
    if (storedName) {
      setUserNameState(storedName);
    }
    const storedId = localStorage.getItem('bugbee_user_id');
    if (storedId) {
      setUserIdState(storedId);
    }
  }, []);

  const setUserId = useCallback((id: string) => {
    setUserIdState(id);
    localStorage.setItem('bugbee_user_id', id);
  }, []);

  const setUserName = useCallback(
    (name: string) => {
      setUserNameState(name);
      localStorage.setItem('bugbee_username', name);

      // Look up team_member_id when userName changes
      if (name.trim()) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('bugbee_token') : null;
        fetch('/api/team-members', {
          headers: { 'x-bugbee-token': token || '' },
        })
          .then((res) => {
            if (!res.ok) return null;
            return res.json();
          })
          .then((members) => {
            if (!Array.isArray(members)) return;
            const match = members.find(
              (m: { name: string; id: string }) =>
                m.name.toLowerCase() === name.trim().toLowerCase()
            );
            if (match) {
              setUserId(match.id);
            }
          })
          .catch(() => {
            // Silently fail — userId lookup is best-effort
          });
      }
    },
    [setUserId]
  );

  return (
    <UserContext.Provider value={{ userName, setUserName, userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
