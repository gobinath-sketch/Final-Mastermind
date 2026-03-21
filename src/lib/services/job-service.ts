import { JobSnapshot } from '@/shared/database/types'

export interface JobSearchParams {
  query: string
  location?: string
  remote?: boolean
  salary_min?: number
  salary_max?: number
  job_type?: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive'
  skills?: string[]
}

export interface JobSearchResult {
  jobs: JobSnapshot[]
  total: number
  page: number
  hasMore: boolean
}

class JobService {
  private baseUrl = '/api/jobs'
  
  // API Keys
  private adzunaKey = process.env.NEXT_PUBLIC_ADZUNA_API_KEY || '409ce85eda71617b211a05a10f73445d'
  private adzunaAppId = process.env.NEXT_PUBLIC_ADZUNA_APP_ID || '9d4da7c6'
  private jsearchKey = process.env.NEXT_PUBLIC_JSEARCH_API_KEY || 'ef7994ada9mshe853dff7586d068p1b8839jsneb6805952289'

  async searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching jobs:', error)
      throw new Error('Failed to search jobs')
    }
  }

  async getJobDetails(jobId: string, source: string): Promise<JobSnapshot> {
    try {
      const response = await fetch(`${this.baseUrl}/details/${source}/${jobId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching job details:', error)
      throw new Error('Failed to fetch job details')
    }
  }

  async getRecommendedJobs(userId: string): Promise<JobSnapshot[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching recommended jobs:', error)
      throw new Error('Failed to fetch recommended jobs')
    }
  }

  async saveJob(userId: string, job: JobSnapshot, source: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          job,
          source,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error saving job:', error)
      throw new Error('Failed to save job')
    }
  }

  async getSavedJobs(userId: string): Promise<JobSnapshot[]> {
    try {
      const response = await fetch(`${this.baseUrl}/saved/${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
      throw new Error('Failed to fetch saved jobs')
    }
  }

  async removeSavedJob(userId: string, jobId: string, source: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/saved/${userId}/${source}/${jobId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error removing saved job:', error)
      throw new Error('Failed to remove saved job')
    }
  }
}

export const jobService = new JobService()
