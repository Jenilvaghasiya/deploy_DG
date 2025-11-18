// src/contexts/TourContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const [tourStates, setTourStates] = useState({});

  useEffect(() => {
    const savedStates = localStorage.getItem("tourStates");
    if (savedStates) {
      setTourStates(JSON.parse(savedStates));
    }
  }, []);

  const hasCompletedTour = (tourName) => {
    return tourStates[tourName] === true;
  };

  const completeTour = (tourName) => {
    const newStates = { ...tourStates, [tourName]: true };
    setTourStates(newStates);
    localStorage.setItem("tourStates", JSON.stringify(newStates));
  };

  const resetTour = (tourName) => {
    const newStates = { ...tourStates };
    delete newStates[tourName];
    setTourStates(newStates);
    localStorage.setItem("tourStates", JSON.stringify(newStates));
  };

  const resetAllTours = () => {
    setTourStates({});
    localStorage.removeItem("tourStates");
  };

  return (
    <TourContext.Provider
      value={{
        hasCompletedTour,
        completeTour,
        resetTour,
        resetAllTours,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
