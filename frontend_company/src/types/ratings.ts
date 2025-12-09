export interface BranchRating {
  id: string
  rating: number
  comment?: string
  service_quality?: number
  staff_friendliness?: number
  facility_cleanliness?: number
  wait_time_satisfaction?: number
  would_recommend?: boolean
  admin_response?: string
  responded_by?: string
  responded_at?: string
  branch_id: string
  customer_id: string
  service_request_id: string
  created_at: string
  updated_at?: string
  customer_name: string
  service_name: string
  responder_name?: string
}

export interface RatingStatistics {
  average_rating: number
  total_ratings: number
  rating_distribution: {
    "5": number
    "4": number
    "3": number
    "2": number
    "1": number
  }
  average_service_quality?: number
  average_staff_friendliness?: number
  average_facility_cleanliness?: number
  average_wait_time_satisfaction?: number
  recommendation_percentage?: number
}

export interface BranchWithRatings {
  id: string
  name: string
  code: string
  address: string
  city_id: string
  postal_code: string
  phone: string
  email: string
  manager_name: string
  latitude: number
  longitude: number
  is_active: boolean
  company_id: string
  company_name: string
  created_by: string
  rating_stats: RatingStatistics
}

export interface RatingResponse {
  message: string
  rating_id: string
}

export interface AdminResponseRequest {
  admin_response: string
}

export interface RatingsListResponse {
  data: BranchRating[]
  count: number
}

export interface RatingFilters {
  skip?: number
  limit?: number
  rating?: number
  hasResponse?: boolean
  dateFrom?: string
  dateTo?: string
  searchTerm?: string
}

export type RatingCategory = 
  | 'overall'
  | 'service_quality'
  | 'staff_friendliness'
  | 'facility_cleanliness'
  | 'wait_time_satisfaction'
