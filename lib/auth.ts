export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phoneNumber: string;
    role: string;
    profilePicture?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    onboardingCompleted?: boolean;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

  async sendPhoneCode(phoneNumber: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/send-phone-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || "Failed to send verification code");
    }
    return response.json();
  }

  async registerWithPhone(data: {
    name: string;
    phoneNumber: string;
    email?: string;
    role?: string;
  }): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/register/phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, deviceInfo: this.getDeviceInfo() }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  async registerWithEmail(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: string;
  }): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/register/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, deviceInfo: this.getDeviceInfo() }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  async loginWithPhone(phoneNumber: string, verificationCode: string): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/login/phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber,
        verificationCode,
        deviceInfo: this.getDeviceInfo(),
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  async loginWithEmail(email: string, password: string): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/login/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        deviceInfo: this.getDeviceInfo(),
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const tokens: AuthTokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }

  async loginWithGoogle(): Promise<void> {
    window.location.href = `${this.baseUrl}/auth/google`;
  }

/**
 * Request password reset
 */
async requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || "Failed to send password reset email");
  }

  return response.json();
}

/**
 * Validate reset token
 */
async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const response = await fetch(`${this.baseUrl}/auth/validate-reset-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return { valid: false };
  }

  return response.json();
}

/**
 * Reset password with token
 */
async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || "Failed to reset password");
  }

  return response.json();
}


  async logout(): Promise<void> {
    const accessToken = this.getAccessToken();
    if (accessToken) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (error) {
        console.error("Logout API call failed:", error);
      }
    }
    this.clearTokens();
  }

  async refreshToken(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const tokens: AuthTokens = await response.json();
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  isTokenExpired(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return true;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  async ensureValidToken(): Promise<boolean> {
    if (!this.isLoggedIn()) return false;
    
    if (this.isTokenExpired()) {
      const newTokens = await this.refreshToken();
      return !!newTokens;
    }
    
    return true;
  }

  async verifyToken(): Promise<boolean> {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;

    // If expired, try refreshing first
    if (this.isTokenExpired()) {
      console.warn("Access token expired, attempting refresh...");
      const refreshed = await this.refreshToken();
      return !!refreshed;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-token`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 401) {
        console.warn("Access token invalid, attempting refresh...");
        const refreshed = await this.refreshToken();
        return !!refreshed;
      }

      return response.ok;
    } catch (error) {
      console.error("Token verification failed:", error);
      return false;
    }
  }

  async getProfile() {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) return null;
      const { user } = await response.json();
      return user;
    } catch (error) {
      return null;
    }
  }

  isValidPhoneNumber(phoneNumber: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  private storeTokens(tokens: AuthTokens): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(tokens.user));
  }

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  }

  getStoredUser() {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  private clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  private getDeviceInfo() {
    if (typeof window === "undefined") return {};
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: { width: screen.width, height: screen.height },
      timestamp: new Date().toISOString(),
    };
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();