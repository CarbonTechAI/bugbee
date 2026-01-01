'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
    userName: string;
    setUserName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [userName, setUserNameState] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('bugbee_username');
        if (stored) {
            setUserNameState(stored);
        }
    }, []);

    const setUserName = (name: string) => {
        setUserNameState(name);
        localStorage.setItem('bugbee_username', name);
    };

    return (
        <UserContext.Provider value={{ userName, setUserName }}>
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
