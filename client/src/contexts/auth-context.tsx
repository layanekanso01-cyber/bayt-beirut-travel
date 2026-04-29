import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { scopedStorageKey } from '@/lib/user-scope';

interface User {
  id: string;
  username: string;
  email?: string | null;
  name?: string | null;
  role: 'user' | 'admin';
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, name?: string, email?: string, nationality?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: { name?: string | null; email?: string | null }) => void;
  favorites: number[];
  toggleFavorite: (poiId: number) => void;
  addReview: (poiId: number, rating: number, text: string) => void;
  getReviews: (poiId: number) => Array<{ rating: number; text: string; date: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const devAdmins = [
  {
    username: 'ziad',
    password: 'ziad123',
    id: 'dev-admin-ziad',
    email: 'ziadchatila2005@gmail.com',
    name: 'Ziad Admin',
  },
  {
    username: 'layane',
    password: 'layane123',
    id: 'dev-admin-layane',
    email: 'layanekanso01@gmail.com',
    name: 'Layane Admin',
  },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [reviews, setReviews] = useState<{ [key: number]: Array<{ rating: number; text: string; date: string }> }>({});

  function loadUserState(nextUser: User | null) {
    if (!nextUser) {
      setFavorites([]);
      setReviews({});
      return;
    }

    setFavorites(readJson<number[]>(scopedStorageKey(nextUser, 'favorites'), []));
    fetch(`/api/favorites/collections?userId=${encodeURIComponent(nextUser.id)}`)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load favorites');
        return response.json();
      })
      .then((collections: Array<{ poiIds?: number[] }>) => {
        const dbFavorites = Array.from(new Set(collections.flatMap((collection) => collection.poiIds ?? [])));
        setFavorites(dbFavorites);
        localStorage.setItem(scopedStorageKey(nextUser, 'favorites'), JSON.stringify(dbFavorites));
      })
      .catch(() => undefined);
    setReviews(readJson<{ [key: number]: Array<{ rating: number; text: string; date: string }> }>(
      scopedStorageKey(nextUser, 'reviews'),
      {}
    ));
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const nextUser = { ...parsedUser, role: parsedUser.role || 'user' };
      setUser(nextUser);
      loadUserState(nextUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const normalizedLogin = username.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const devAdmin = devAdmins.find(
      (admin) =>
        (admin.username === normalizedLogin || admin.email.toLowerCase() === normalizedLogin) &&
        admin.password === normalizedPassword
    );

    if (devAdmin) {
      const adminUser: User = {
        id: devAdmin.id,
        username: devAdmin.username,
        email: devAdmin.email,
        name: devAdmin.name,
        role: 'admin',
        isAdmin: true,
      };
      setUser(adminUser);
      loadUserState(adminUser);
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      return;
    }

    let response: Response;
    try {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error('Backend server is not running. Start it with npm run dev.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const userData = await response.json();
    setUser(userData);
    loadUserState(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.role === 'admin') {
      localStorage.setItem('adminUser', JSON.stringify(userData));
    } else {
      localStorage.removeItem('adminUser');
    }
  };

  const signup = async (username: string, password: string, name?: string, email?: string, nationality?: string, phone?: string) => {
    let response: Response;
    try {
      response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, email, nationality, phone }),
      });
    } catch {
      throw new Error('Backend server is not running. Start it with npm run dev.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Signup failed' }));
      throw new Error(error.message || 'Signup failed');
    }

    const userData = await response.json();
    setUser(userData);
    loadUserState(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('adminUser');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    loadUserState(null);
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
  };

  const updateUserProfile = (profile: { name?: string | null; email?: string | null }) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser: User = {
        ...currentUser,
        name: profile.name ?? currentUser.name,
        email: profile.email ?? currentUser.email,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (updatedUser.role === 'admin') {
        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
      }

      return updatedUser;
    });
  };

  const toggleFavorite = (poiId: number) => {
    if (!user) return;
    const wasSaved = favorites.includes(poiId);
    const newFavorites = wasSaved
      ? favorites.filter(id => id !== poiId)
      : [...favorites, poiId];
    setFavorites(newFavorites);
    localStorage.setItem(scopedStorageKey(user, 'favorites'), JSON.stringify(newFavorites));

    fetch('/api/favorites/default/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poiId, userId: user.id }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Could not sync favorite');
        return response.json();
      })
      .then((data: { collections?: Array<{ poiIds?: number[] }> }) => {
        if (data.collections) {
          const dbFavorites = Array.from(new Set(data.collections.flatMap((collection) => collection.poiIds ?? [])));
          setFavorites(dbFavorites);
          localStorage.setItem(scopedStorageKey(user, 'favorites'), JSON.stringify(dbFavorites));
        }
      })
      .catch(() => {
        setFavorites(favorites);
        localStorage.setItem(scopedStorageKey(user, 'favorites'), JSON.stringify(favorites));
      });
  };

  const addReview = (poiId: number, rating: number, text: string) => {
    if (!user) return;
    const poiReviews = reviews[poiId] || [];
    const newReview = { rating, text, date: new Date().toISOString() };
    const updatedReviews = { ...reviews, [poiId]: [...poiReviews, newReview] };
    setReviews(updatedReviews);
    localStorage.setItem(scopedStorageKey(user, 'reviews'), JSON.stringify(updatedReviews));
  };

  const getReviews = (poiId: number) => {
    return reviews[poiId] || [];
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUserProfile, favorites, toggleFavorite, addReview, getReviews }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
