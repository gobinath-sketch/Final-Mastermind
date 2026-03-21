'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/shared/hooks/use-toast'
import {
  FileText,
  Download,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Eye
} from 'lucide-react'
import { BackToDashboardButton } from '@/components/BackToDashboardButton'
import { aiService, ResumeGenerationRequest } from '@/lib/services/ai-service'
// import { createClient } from '@/shared/supabase/client' - REMOVED
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Resume {
  id: string
  title: string
  content_markdown: string
  version: number
  is_active: boolean
  created_at: string
}

export default function ResumePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<ResumeGenerationRequest>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: ''
    },
    experience: [],
    education: [],
    skills: [],
    targetJob: {
      title: '',
      company: '',
      description: ''
    },
    additionalInfo: ''
  })

  const fetchResumes = useCallback(async () => {
    if (!user) return

    try {
      const res = await fetch('/api/resumes')
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setResumes(data || [])
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast({
        title: "Error",
        description: "Failed to fetch resumes",
        variant: "destructive",
      })
    }
  }, [user, toast])

  const saveResume = useCallback(async (title: string, markdown: string, existingId?: string) => {
    if (!user) return
    try {
      let res;
      if (existingId) {
        res = await fetch('/api/resumes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: existingId,
            title,
            content_markdown: markdown,
            version: 1,
            is_active: true
          })
        })
      } else {
        res = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content_markdown: markdown,
            version: 1,
            is_active: true
          })
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      toast({ title: 'Resume saved' })
      await fetchResumes()
      return data.id as string
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Try again'
      toast({ title: 'Save failed', description: message, variant: 'destructive' })
      return undefined
    }
  }, [user, toast, fetchResumes])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      fetchResumes()
    }
  }, [user, loading, router, fetchResumes])

  const handleGenerateResume = async () => {
    if (!formData.personalInfo.name || !formData.personalInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least your name and email",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await aiService.generateResume(formData)

      toast({
        title: "Resume Generated!",
        description: "Your AI-powered resume has been created successfully",
      })

      setShowBuilder(false)
      setShowPreview(true)
      const tempTitle = `${formData.personalInfo.name} - Resume`
      const newId = await saveResume(tempTitle, result.resume.markdown)
      setSelectedResume({
        id: newId || Date.now().toString(),
        title: tempTitle,
        content_markdown: result.resume.markdown,
        version: 1,
        is_active: true,
        created_at: new Date().toISOString()
      })

      fetchResumes()
    } catch {
      toast({
        title: "Generation Failed",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const container = document.getElementById('resume-preview-container')
      if (!container) throw new Error('Preview not found')
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgProps = { width: pageWidth, height: (canvas.height * pageWidth) / canvas.width }
      let y = 0
      pdf.addImage(img, 'PNG', 0, y, imgProps.width, imgProps.height)
      while (imgProps.height - y > pageHeight) {
        y += pageHeight
        pdf.addPage()
        pdf.addImage(img, 'PNG', 0, -y, imgProps.width, imgProps.height)
      }
      pdf.save(`${selectedResume?.title || 'resume'}.pdf`)
      toast({ title: 'PDF downloaded' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Try again'
      toast({ title: 'Download failed', description: message, variant: 'destructive' })
    }
  }

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        company: '',
        duration: '',
        description: '',
        achievements: []
      }]
    }))
  }

  const updateExperience = (index: number, field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        institution: '',
        year: '',
        gpa: ''
      }]
    }))
  }

  const updateEducation = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/50 border-b border-gray-800 backdrop-blur-sm">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BackToDashboardButton className="mr-4" />
              <h1 className="text-2xl font-bold text-white">Resume Builder</h1>
            </div>
            <Button
              onClick={() => setShowBuilder(true)}
              className="bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Resume
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showBuilder && !showPreview && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Sparkles className="h-16 w-16 text-sky-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">AI-Powered Resume Builder</h2>
              <p className="text-gray-400 text-lg">
                Create ATS-friendly resumes with AI assistance
              </p>
            </div>

            {resumes.length > 0 ? (
              <div className="grid gap-6">
                <h3 className="text-xl font-semibold text-white">Your Resumes</h3>
                {resumes.map((resume) => (
                  <Card key={resume.id} className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">{resume.title}</CardTitle>
                          <CardDescription className="text-gray-400">
                            Version {resume.version} • Created {new Date(resume.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResume(resume)
                              setShowPreview(true)
                            }}
                            className="text-gray-300 border-gray-600 hover:border-sky-400"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF()}
                            className="text-gray-300 border-gray-600 hover:border-sky-400"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No resumes yet</h3>
                  <p className="text-gray-500 mb-6">
                    Create your first AI-powered resume to get started
                  </p>
                  <Button
                    onClick={() => setShowBuilder(true)}
                    className="bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Resume
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showBuilder && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Resume Builder</CardTitle>
                <CardDescription className="text-gray-400">
                  Fill in your information to generate an AI-powered resume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Full Name *"
                      value={formData.personalInfo.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-600"
                    />
                    <Input
                      placeholder="Email *"
                      type="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-600"
                    />
                    <Input
                      placeholder="Phone"
                      value={formData.personalInfo.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-600"
                    />
                    <Input
                      placeholder="Location"
                      value={formData.personalInfo.location}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, location: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                  <Input
                    placeholder="Enter skills separated by commas (e.g., React, Python, Marketing)"
                    value={formData.skills.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>

                {/* Experience */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Experience</h3>
                    <Button
                      onClick={addExperience}
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-600 hover:border-sky-400"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Experience
                    </Button>
                  </div>
                  {formData.experience.map((exp, index) => (
                    <Card key={index} className="bg-gray-800/50 border-gray-600 mb-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-white font-medium">Experience {index + 1}</h4>
                          <Button
                            onClick={() => removeExperience(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Job Title"
                            value={exp.title}
                            onChange={(e) => updateExperience(index, 'title', e.target.value)}
                            className="bg-gray-700 border-gray-500"
                          />
                          <Input
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                            className="bg-gray-700 border-gray-500"
                          />
                          <Input
                            placeholder="Duration (e.g., Jan 2020 - Present)"
                            value={exp.duration}
                            onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                            className="bg-gray-700 border-gray-500"
                          />
                        </div>
                        <textarea
                          placeholder="Job Description"
                          value={exp.description}
                          onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          className="w-full mt-4 p-3 bg-gray-700 border border-gray-500 rounded-md text-white placeholder-gray-400"
                          rows={3}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Education */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Education</h3>
                    <Button
                      onClick={addEducation}
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-600 hover:border-sky-400"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Education
                    </Button>
                  </div>
                  {formData.education.map((edu, index) => (
                    <Card key={index} className="bg-gray-800/50 border-gray-600 mb-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-white font-medium">Education {index + 1}</h4>
                          <Button
                            onClick={() => removeEducation(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            className="bg-gray-700 border-gray-500"
                          />
                          <Input
                            placeholder="Institution"
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            className="bg-gray-700 border-gray-500"
                          />
                          <Input
                            placeholder="Year"
                            value={edu.year}
                            onChange={(e) => updateEducation(index, 'year', e.target.value)}
                            className="bg-gray-700 border-gray-500"
                          />
                          <Input
                            placeholder="GPA (optional)"
                            value={edu.gpa}
                            onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                            className="bg-gray-700 border-gray-500"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Target Job */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Target Job (Optional)</h3>
                  <div className="space-y-4">
                    <Input
                      placeholder="Job Title"
                      value={formData.targetJob?.title || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetJob: { ...prev.targetJob!, title: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-600"
                    />
                    <Input
                      placeholder="Company"
                      value={formData.targetJob?.company || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetJob: { ...prev.targetJob!, company: e.target.value }
                      }))}
                      className="bg-gray-800 border-gray-600"
                    />
                    <textarea
                      placeholder="Job Description"
                      value={formData.targetJob?.description || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetJob: { ...prev.targetJob!, description: e.target.value }
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                  <textarea
                    placeholder="Any additional information, certifications, or achievements"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: e.target.value
                    }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400"
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-6">
                  <Button
                    onClick={() => setShowBuilder(false)}
                    variant="outline"
                    className="text-gray-300 border-gray-600 hover:border-sky-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateResume}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Resume
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showPreview && selectedResume && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">{selectedResume.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      AI-Generated Resume Preview
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleDownloadPDF()}
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-600 hover:border-sky-400"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => setShowPreview(false)}
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-600 hover:border-sky-400"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white text-black p-8 rounded-lg" id="resume-preview-container">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: selectedResume.content_markdown
                        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
                        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
                        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                        .replace(/\*(.*)\*/gim, '<em>$1</em>')
                        .replace(/^• (.*$)/gim, '<li class="ml-4">$1</li>')
                        .replace(/\n/gim, '<br>')
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
