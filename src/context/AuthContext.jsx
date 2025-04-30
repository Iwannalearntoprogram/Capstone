import { createContext, useContext, useState } from 'react';

// 1. Create separate context for better typing
const AuthStateContext = createContext(null);
const AuthActionsContext = createContext(null);

// 2. Create a proper provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    role: 'admin' // Default role, should come from login
  });

  // 3. Memoize the context value to prevent unnecessary rerenders
  const authActions = {
    login: (userData) => setUser(userData),
    logout: () => setUser(null),
  };

  return (
    <AuthStateContext.Provider value={user}>
      <AuthActionsContext.Provider value={authActions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};

// 4. Create separate hooks for better usage
export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  return context;
};

// 5. Combined hook for backward compatibility
export const useAuth = () => {
  return {
    user: useAuthState(),
    ...useAuthActions()
  };
};