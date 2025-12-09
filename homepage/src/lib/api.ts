// API Types
export interface CompanyRegistrationData {
  company: {
    name: string;
    description: string;
    industry_type_id: string;
    category_id: string;
    website?: string;
    email: string;
    phone: string;
    address: string;
    city_id: string;
  };
  admin_user: {
    email: string;
    password: string;
    full_name: string;
  };
  main_branch: {
    name: string;
    code: string;
    address: string;
    postal_code: string;
    phone: string;
    email: string;
    manager_name: string;
    city_id: string;
    latitude: number;
    longitude: number;
  };
  registration_notes?: string;
}

export interface CompanyRegistrationResponse {
  company_id: string;
  user_id: string;
  branch_id: string;
  registration_status: "pending_review" | "approved" | "rejected";
  message: string;
  next_steps: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Location Types
export interface Country {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface State {
  id: string;
  name: string;
  code: string;
  country_id: string;
  is_active: boolean;
  country: Country;
}

export interface City {
  id: string;
  name: string;
  state_id: string | null;
  country_id: string;
  latitude: number;
  longitude: number;
  population: number;
  is_active: boolean;
  country: Country;
  state: State | null;
}

export interface LocationsResponse<T> {
  count: number;
  data: T[];
}

export interface IndustryType {
  id: string;
  name: string;
  description: string;
  code: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  code: string;
  is_active: boolean;
  requires_business_license: boolean;
  requires_tax_id: boolean;
  requires_professional_license: boolean;
  requires_incorporation_docs: boolean;
  requires_personal_id: boolean;
  min_employees: number;
  max_employees: number;
  sort_order: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable for API base URL, fallback to default
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let apiError: ApiError = { message: errorMessage };

      try {
        const errorData = await response.json();
        apiError = {
          message: errorData.detail || errorData.message || errorMessage,
          code: errorData.code,
          details: errorData.details,
        };
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new Error(apiError.message);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error("Failed to parse response JSON");
    }
  }

  async registerCompany(data: CompanyRegistrationData): Promise<CompanyRegistrationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return this.handleResponse<CompanyRegistrationResponse>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during registration");
    }
  }

  // Location endpoints
  async getCountries(): Promise<Country[]> {
    try {
      const response = await fetch(`${this.baseUrl}/locations/countries`);
      const result = await this.handleResponse<LocationsResponse<Country>>(response);
      return result.data.filter(country => country.is_active);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch countries");
    }
  }

  async getStates(countryId: string, skip: number = 0, limit: number = 100): Promise<State[]> {
    try {
      const url = new URL(`${this.baseUrl}/locations/states`);
      url.searchParams.set('skip', skip.toString());
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('country_id', countryId);

      const response = await fetch(url.toString());
      const result = await this.handleResponse<LocationsResponse<State>>(response);
      return result.data.filter(state => state.is_active);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch states");
    }
  }

  async getCities(stateId: string, popular: boolean = false, skip: number = 0, limit: number = 100): Promise<City[]> {
    try {
      const url = new URL(`${this.baseUrl}/locations/cities`);
      url.searchParams.set('skip', skip.toString());
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('state_id', stateId); // Using state_code parameter but passing state_id value
      url.searchParams.set('popular', popular.toString());

      const response = await fetch(url.toString());
      const result = await this.handleResponse<LocationsResponse<City>>(response);
      return result.data.filter(city => city.is_active);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch cities");
    }
  }

  async getIndustryTypes(skip: number = 0, limit: number = 100): Promise<IndustryType[]> {
    try {
      const url = new URL(`${this.baseUrl}/industry-types/`);
      url.searchParams.set('skip', skip.toString());
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('active_only', 'true');

      const response = await fetch(url.toString());
      const result = await this.handleResponse<LocationsResponse<IndustryType>>(response);
      return result.data.filter(industry => industry.is_active);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch industry types");
    }
  }

  async getCategories(skip: number = 0, limit: number = 100): Promise<Category[]> {
    try {
      const url = new URL(`${this.baseUrl}/categories/`);
      url.searchParams.set('skip', skip.toString());
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString());
      const result = await this.handleResponse<LocationsResponse<Category>>(response);
      return result.data.filter(category => category.is_active);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch categories");
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();