export interface ResumeGenerationRequest {
  personalInfo: {
    name: string
    email: string
    phone?: string
    location?: string
  }
  experience: Array<{
    title: string
    company: string
    duration: string
    description: string
    achievements: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    year: string
    gpa?: string
  }>
  skills: string[]
  targetJob?: {
    title: string
    company?: string
    description?: string
  }
  additionalInfo?: string
}

export interface ResumeGenerationResponse {
  resume: {
    markdown: string
    html: string
    pdfUrl?: string
  }
  suggestions: string[]
  atsScore: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    suggestions?: string[]
    actions?: Array<{
      type: string
      label: string
      data: Record<string, unknown>
    }>
  }
}

export interface ChatRequest {
  message: string
  context?: {
    userProfile?: Record<string, unknown>
    currentResume?: Record<string, unknown>
    jobSearchHistory?: Record<string, unknown>
    conversationHistory?: ChatMessage[]
  }
}

export interface ChatResponse {
  message: string
  suggestions?: string[]
  actions?: Array<{
    type: string
    label: string
    data: Record<string, unknown>
  }>
}

class AIService {
  private baseUrl = '/api/ai'

  async generateResume(request: ResumeGenerationRequest): Promise<ResumeGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/resume/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating resume:', error)
      throw new Error('Failed to generate resume')
    }
  }

  async improveResume(resumeId: string, improvements: string[]): Promise<ResumeGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/resume/improve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          improvements,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error improving resume:', error)
      throw new Error('Failed to improve resume')
    }
  }

  async analyzeJobMatch(resumeId: string, jobDescription: string): Promise<{
    matchScore: number
    strengths: string[]
    improvements: string[]
    missingSkills: string[]
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/resume/analyze-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          jobDescription,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error analyzing job match:', error)
      throw new Error('Failed to analyze job match')
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error in chat:', error)
      throw new Error('Failed to get chat response')
    }
  }

  async generateCoverLetter(
    resumeId: string,
    jobDescription: string,
    companyName: string
  ): Promise<{ coverLetter: string; suggestions: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/cover-letter/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          jobDescription,
          companyName,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating cover letter:', error)
      throw new Error('Failed to generate cover letter')
    }
  }

  async optimizeForATS(resumeId: string, jobDescription: string): Promise<{
    optimizedResume: string
    changes: string[]
    atsScore: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/resume/optimize-ats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          jobDescription,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error optimizing for ATS:', error)
      throw new Error('Failed to optimize resume for ATS')
    }
  }
}

export const aiService = new AIService()
