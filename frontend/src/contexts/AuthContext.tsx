import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api, { auth } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (data: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/users/me/');
        const userData = response.data;
        setUser({
          id: userData.id,
          email: userData.email,
          role: userData.role
        });
        setIsAdmin(userData.role === 'admin');
      } catch (error) {
        console.error("Auth check failed", error);
        localStorage.removeItem('token');
        setUser(null);
        setIsAdmin(false);
      }
    }
    setLoading(false);
  };

  const login = async (data: any) => {
    const response = await auth.signIn(data);
    const { token, user_id, email, role } = response.data;
    localStorage.setItem('token', token);
    setUser({ id: user_id, email, role });
    setIsAdmin(role === 'admin');
    return response;
  };

  const register = async (data: any) => {
    const response = await auth.signUp(data);
    const { token, user_id, email, role } = response.data;
    localStorage.setItem('token', token);
    setUser({ id: user_id, email, role });
    setIsAdmin(role === 'admin');
    return response;
  };

  const logout = async () => {
    try {
      // Optional: Notify backend to invalidate token if needed
      // await auth.signOut(); 
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
