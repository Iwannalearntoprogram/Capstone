// hooks/useAuth.js
import { useState, useEffect } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('user');
      try {
        setUser(updatedUser ? JSON.parse(updatedUser) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // remove token too
    setUser(null);
  };

  const userRole = user?.role || null;

  return {
    user,
    userRole,
    isAuthenticated: !!user,
    logout
  };
};

export default useAuth;

