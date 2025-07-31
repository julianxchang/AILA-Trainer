export interface AuthUser {
  id: string;
  name: string;
  firm: string;
  token: string;
}

export const authService = {
  login: (token: string): AuthUser => {
    // In a real app, validate JWT and extract user info
    const user: AuthUser = {
      id: "demo-user",
      name: "Sarah Johnson, Esq.",
      firm: "Johnson & Associates",
      token,
    };
    
    localStorage.setItem("auth-token", token);
    localStorage.setItem("auth-user", JSON.stringify(user));
    
    return user;
  },

  logout: (): void => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
  },

  getCurrentUser: (): AuthUser | null => {
    const token = localStorage.getItem("auth-token");
    const userStr = localStorage.getItem("auth-user");
    
    if (token && userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    
    return null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth-token");
  },
};
