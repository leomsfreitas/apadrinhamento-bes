import { createContext, useEffect, useState } from "react";
import { FirebaseAuthService } from "../services/auth/FirebaseAuthService";
import { User } from "firebase/auth";

interface IUserContextData {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<IUserContextData>({} as IUserContextData);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.verify(setUser);
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loggedInUser = await FirebaseAuthService.login(email, password);
      setUser(loggedInUser);
      return loggedInUser !== null;
    } catch (error) {
      console.error("Erro ao fazer login no AuthContext:", error);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const registeredUser = await FirebaseAuthService.register(email, password);
      setUser(registeredUser);
      return registeredUser !== null;
    } catch (error) {
      console.error("Erro ao registrar no AuthContext:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await FirebaseAuthService.logout();
      setUser(null);
    } catch (error) {
      console.error("Erro ao fazer logout no AuthContext:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};