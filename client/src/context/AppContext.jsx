import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState({
    username: '',
    password: '',
    NAME: '',
    UID: '',
    key: 'AIzaSyD81UuGcWJh6-0e6Eyxo1_kEnBWJNQFQoo', // default key
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [nonSubmittedAssignments, setNonSubmittedAssignments] = useState({});
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Non-submitted, 3: Generated
  
  // Reset error state
  const clearError = () => setError(null);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        setIsLoading,
        courses,
        setCourses,
        nonSubmittedAssignments,
        setNonSubmittedAssignments,
        generatedDocuments,
        setGeneratedDocuments,
        error,
        setError,
        currentStep,
        setCurrentStep,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}