import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type AdminUser = {
  username: string;
  name: string;
  email: string;
  role: "admin";
  isAdmin: true;
};

type AdminAuthContextType = {
  admin: AdminUser | null;
  isAdmin: boolean;
  adminLogin: (username: string, password: string) => Promise<void>;
  adminLogout: () => void;
};

const adminCredentials = {
  username: "admin",
  password: "admin123",
};

const adminProfile: AdminUser = {
  username: "admin",
  name: "Bayt Beirut Admin",
  email: "layanekanso01@gmail.com",
  role: "admin",
  isAdmin: true,
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const savedAdmin = localStorage.getItem("adminUser");
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  async function adminLogin(username: string, password: string) {
    if (username !== adminCredentials.username || password !== adminCredentials.password) {
      throw new Error("Invalid admin username or password");
    }

    setAdmin(adminProfile);
    localStorage.setItem("adminUser", JSON.stringify(adminProfile));
  }

  function adminLogout() {
    setAdmin(null);
    localStorage.removeItem("adminUser");
  }

  return (
    <AdminAuthContext.Provider value={{ admin, isAdmin: Boolean(admin?.isAdmin), adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
}
