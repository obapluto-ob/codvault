import { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '');

  const login = (t) => { setToken(t); sessionStorage.setItem('admin_token', t); };
  const logout = () => { setToken(''); sessionStorage.removeItem('admin_token'); };

  return (
    <AdminContext.Provider value={{ token, isAdmin: !!token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
