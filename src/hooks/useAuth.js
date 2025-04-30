import { useState, useEffect } from 'react';

const useAuth = () => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Assuming user info is stored in localStorage after login
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    } else {
      setUserRole(null);
    }
  }, []);

  return { userRole };
};

export default useAuth;
