import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(tokenToVerify);
      } else {
        // Token is invalid or expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, return a generic error
        return { 
          success: false, 
          error: response.status === 401 
            ? 'Invalid email or password' 
            : 'Login failed. Please try again.' 
        };
      }

      if (!response.ok) {
        // 401 is an expected response for invalid credentials - don't log as error
        const errorMessage = data.error || data.errors?.join(', ') || 'Login failed. Please check your credentials.';
        return { 
          success: false, 
          error: errorMessage
        };
      }

      const { token: newToken, user: userData } = data;
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      // Only log unexpected network errors, not authentication failures
      if (error.name !== 'TypeError' || !error.message.includes('fetch')) {
        console.error('Login error:', error);
      }
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        return { 
          success: false, 
          error: 'Registration failed. Please try again.' 
        };
      }

      if (!response.ok) {
        // Expected validation/conflict errors - don't log as error
        const errorMessage = data.error || data.errors?.join(', ') || 'Registration failed. Please check your input.';
        return { 
          success: false, 
          error: errorMessage
        };
      }

      const { token: newToken, user: userData } = data;
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      // Only log unexpected network errors
      if (error.name !== 'TypeError' || !error.message.includes('fetch')) {
        console.error('Registration error:', error);
      }
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
        getAuthHeaders,
        isAuthenticated: isAuthenticated(),
        isAdmin: isAdmin()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


