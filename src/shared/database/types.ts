export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          billing_address: Json | null
          payment_method: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          payment_method?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          payment_method?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables mapping to Mongoose models if needed
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          category: string
          merchant: string
          metadata: Json | null
          created_at: string
        }
      }
    }
  }
}

export type Skill = {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export type UserPreferences = {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    job_alerts: boolean
    stock_alerts: boolean
  }
  job_preferences: {
    locations: string[]
    remote_preference: 'any' | 'remote' | 'hybrid' | 'onsite'
    salary_range: {
      min: number
      max: number
      currency: string
    }
  }
}

export type JobSnapshot = {
  id?: string
  title: string
  company: string
  location?: string
  description?: string
  apply_url?: string
  posted_date?: string
  remote_type?: string
  salary?: string
  source?: string
  salary_range?: {
    min: number
    max: number
    currency: string
  }
  requirements?: string[]
  benefits?: string[]
}
