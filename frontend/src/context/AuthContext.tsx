import React, { createContext, useContext, useEffect, useState } from "react";
import type { IUser } from "../assets/assets";
import api from "../configs/api";
import toast from "react-hot-toast";

interface AuthContextProps {
  isLoggedin: boolean;
  setIsLoggedIn: (isLoggedin: boolean) => void;
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  login: (user: { email: string; password: string }) => Promise<void>;
  signUp: (user: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  isLoggedin: false,
  setIsLoggedIn: () => {},
  user: null,
  setUser: () => {},
  login: async () => {},
  signUp: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoggedin, setIsLoggedIn] = useState<boolean>(false);

  const signUp = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      if (!name || !email || !password) {
        toast.error("Please fill all the fields");
        return;
      }
      const { data } = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      if (data.user) {
        setUser(data.user);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (err) {
      console.log(err);
    }
  };
  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      if (!email || !password) {
        toast.error("Please fill all the fields");
        return;
      }
      const { data } = await api.post("/api/auth/login", {
        email,
        password,
      });
      if (data.user) {
        setUser(data.user);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message);
      console.log(err);
    }
  };
  const logout = async () => {
    try {
      const { data } = await api.post("/api/auth/logout");
      toast.success(data?.message || "Logged out");
    } catch (err: any) {
      // even if server fails, clear local state
      toast.error(err?.response?.data?.message || "Logout failed");
    } finally {
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/api/auth/verify");
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchUser();
    })();
  }, []);

  const value = {
    user,
    setUser,
    isLoggedin,
    setIsLoggedIn,
    login,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
