import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "./types";

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const localId = localStorage.getItem("clientId");

    if (!localId) {
      const id = crypto.randomUUID();
      localStorage.setItem("clientId", id);
      setUser({ id, name: "Anonymous" });
    } else {
      setUser({ id: localId, name: "Anonymous" });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
