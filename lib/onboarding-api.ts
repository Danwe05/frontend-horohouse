import { authService } from './auth';

export interface PropertyPreferences {
  propertyType: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  location: string[];
  bedrooms: number[];
  bathrooms: number[];
  features: string[];
}

export interface AgentPreferences {
  licenseNumber: string;
  agency: string;
  experience: number;
  specializations: string[];
  serviceAreas: string[];
}

export interface OnboardingStatus {
  userId: string;
  isCompleted: boolean;
  currentStep: number;
  totalSteps: number;
  propertyPreferences?: PropertyPreferences;
  agentPreferences?: AgentPreferences;
  completedSteps: string[];
  completedAt?: string;
  lastActivityAt: string;
}

export interface OnboardingProgress {
  progress: number;
  currentStep: number;
  totalSteps: number;
}

class OnboardingApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const hasValidToken = await authService.ensureValidToken();
  if (!hasValidToken) throw new Error("Access token required. Please login again.");

  const token = authService.getAccessToken();

  // Merge headers safely
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined), // <--- cast here
  };

  // Only set Content-Type if there is a body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
    // JSON.stringify body if it's an object
    options.body = typeof options.body === 'object' ? JSON.stringify(options.body) : options.body;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${this.baseUrl}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}


  async initializeOnboarding(userRole: string): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/onboarding/initialize', {
      method: 'POST',
      body: JSON.stringify({ userRole }),
    });
  }

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/onboarding/status');
  }

  async getOnboardingProgress(): Promise<OnboardingProgress> {
    return this.request<OnboardingProgress>('/onboarding/progress');
  }

  async updateOnboardingStep(data: {
    currentStep: number;
    stepName: string;
    propertyPreferences?: PropertyPreferences;
    agentPreferences?: AgentPreferences;
  }): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/onboarding/step', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeOnboarding(data: {
    isCompleted: boolean;
    propertyPreferences?: PropertyPreferences;
    agentPreferences?: AgentPreferences;
  }): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/onboarding/complete', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async sendWelcomeEmail(): Promise<void> {
    return this.request<void>('/onboarding/send-welcome-email', {
      method: 'POST',
    });
  }

  async resetOnboarding(): Promise<OnboardingStatus> {
    return this.request<OnboardingStatus>('/onboarding/reset', {
      method: 'POST',
    });
  }
}

export const onboardingApi = new OnboardingApiService();
