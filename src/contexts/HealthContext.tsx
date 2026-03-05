import React, { createContext, useContext, useState, useEffect } from "react";

export interface HealthData {
    heartRate: number;
    spo2: number;
    sleepHours: number;
    stress: number;
}

export interface Preferences {
    isVegetarian: boolean;
    isIndian: boolean;
}

interface HealthContextType {
    healthData: HealthData;
    preferences: Preferences;
    setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
    refreshHealthData: () => void;
}

const defaultHealthData: HealthData = {
    heartRate: 72,
    spo2: 98,
    sleepHours: 7.2,
    stress: 3,
};

const defaultPreferences: Preferences = {
    isVegetarian: false,
    isIndian: false,
};

const HealthContext = createContext<HealthContextType>({
    healthData: defaultHealthData,
    preferences: defaultPreferences,
    setPreferences: () => { },
    refreshHealthData: () => { },
});

export const useHealth = () => useContext(HealthContext);

const generateRandomHealthData = (): HealthData => {
    return {
        heartRate: Math.floor(Math.random() * (110 - 50 + 1)) + 50, // 50 to 110 BPM
        spo2: Math.floor(Math.random() * (100 - 90 + 1)) + 90, // 90 to 100%
        sleepHours: Number((Math.random() * (10 - 4) + 4).toFixed(1)), // 4.0 to 10.0 hrs
        stress: Math.floor(Math.random() * (10 - 1 + 1)) + 1, // 1 to 10
    };
};

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [healthData, setHealthData] = useState<HealthData>(defaultHealthData);
    const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

    const refreshHealthData = () => {
        setHealthData(generateRandomHealthData());
    };

    // Generate random data on first mount (simulating page reload randomness)
    useEffect(() => {
        refreshHealthData();
    }, []);

    return (
        <HealthContext.Provider value={{ healthData, preferences, setPreferences, refreshHealthData }}>
            {children}
        </HealthContext.Provider>
    );
};
