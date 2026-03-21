'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/utils'
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Bot,
  User
} from 'lucide-react'
import { aiService, ChatMessage } from '@/lib/services/ai-service'
import { useAuth } from '@/features/auth/context/AuthContext'

interface ChatbotProps {
  className?: string
}

export default function Chatbot({ className = '' }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasPositioned, setHasPositioned] = useState(false)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  
  const { user } = useAuth()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversationHistory = useCallback(async () => {
    // In a real implementation, you would load from the database
    // For now, we'll start with a welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant. I can help you with:\n\n• Resume building and optimization\n• Job search strategies\n• Stock market analysis\n• Expense tracking\n• Financial planning\n\nWhat would you like help with today?",
        timestamp: new Date().toISOString()
      }])
    }
  }, [messages.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load conversation history
    if (user && isOpen) {
      loadConversationHistory()
    }
  }, [user, isOpen, loadConversationHistory])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await aiService.chat({
        message: inputMessage,
        context: {
          userProfile: user ? { id: user.id, email: user.email } : undefined,
          conversationHistory: messages
        }
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          suggestions: response.suggestions,
          actions: response.actions
        }
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      handleDragStart(e.clientX, e.clientY)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) {
      handleDragStart(touch.clientX, touch.clientY)
    }
  }

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!chatRef.current) return

      const rect = chatRef.current.getBoundingClientRect()
      const newX = clientX - dragStart.x
      const newY = clientY - dragStart.y
      const padding = 16
      const maxX = window.innerWidth - rect.width - padding
      const maxY = window.innerHeight - rect.height - padding

      const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max)

      setPosition({
        x: clamp(newX, padding, Math.max(maxX, padding)),
        y: clamp(newY, padding, Math.max(maxY, padding)),
      })
    },
    [dragStart]
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return
      updatePosition(event.clientX, event.clientY)
    },
    [isDragging, updatePosition]
  )
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })

      if (!chatRef.current) return
      const rect = chatRef.current.getBoundingClientRect()
      const padding = 16
      const maxX = window.innerWidth - rect.width - padding
      const maxY = window.innerHeight - rect.height - padding
      setPosition((prev) => ({
        x: Math.min(prev.x, Math.max(maxX, padding)),
        y: Math.min(prev.y, Math.max(maxY, padding)),
      }))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isDragging) return
      const touch = event.touches[0]
      if (!touch) return
      event.preventDefault()
      updatePosition(touch.clientX, touch.clientY)
    },
    [isDragging, updatePosition]
  )

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      document.addEventListener('touchcancel', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        document.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, handleMouseMove, handleTouchMove])

  useEffect(() => {
    if (isOpen && chatRef.current && !hasPositioned && viewport.width && viewport.height) {
      const padding = 16
      const targetWidth = Math.min(352, viewport.width - padding * 2)
      const targetHeight = Math.min(448, viewport.height - padding * 2)
      const x = Math.max(padding, viewport.width - targetWidth - padding)
      const y = Math.max(padding, viewport.height - targetHeight - padding)
      setPosition({ x, y })
      setHasPositioned(true)
    }
  }, [isOpen, hasPositioned, viewport])

  useEffect(() => {
    if (!isOpen || !viewport.width || !chatRef.current) return
    const padding = 16
    const rect = chatRef.current.getBoundingClientRect()
    const maxX = viewport.width - rect.width - padding
    const maxY = viewport.height - rect.height - padding
    setPosition((prev) => ({
      x: Math.max(padding, Math.min(prev.x, Math.max(maxX, padding))),
      y: Math.max(padding, Math.min(prev.y, Math.max(maxY, padding))),
    }))
  }, [viewport, isOpen, isMinimized])

  const targetExpandedWidth = Math.max(220, Math.min(352, viewport.width ? viewport.width - 32 : 352))
  const expandedWidth = viewport.width
    ? Math.min(targetExpandedWidth, Math.max(viewport.width - 16, 0))
    : targetExpandedWidth

  const targetMinimizedWidth = Math.max(200, Math.min(320, viewport.width ? viewport.width - 48 : 320))
  const minimizedWidth = viewport.width
    ? Math.min(targetMinimizedWidth, expandedWidth, Math.max(viewport.width - 16, 0))
    : targetMinimizedWidth

  const targetExpandedHeight = Math.max(240, Math.min(448, viewport.height ? viewport.height - 96 : 448))
  const expandedHeight = viewport.height
    ? Math.min(targetExpandedHeight, Math.max(viewport.height - 24, 0))
    : targetExpandedHeight

  const targetMinimizedHeight = Math.max(56, Math.min(88, viewport.height ? viewport.height - 48 : 88))
  const minimizedHeight = viewport.height
    ? Math.min(targetMinimizedHeight, Math.max(viewport.height - 24, 0))
    : targetMinimizedHeight

  const resolvedExpandedWidth = expandedWidth > 0 ? expandedWidth : 280
  const resolvedMinimizedWidth = minimizedWidth > 0 ? minimizedWidth : Math.min(resolvedExpandedWidth, 220)
  const resolvedExpandedHeight = expandedHeight > 0 ? expandedHeight : 320
  const resolvedMinimizedHeight = minimizedHeight > 0 ? minimizedHeight : 64

  if (!user) return null

  return (
    <div className={`fixed z-50 ${className}`}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
            setHasPositioned(false)
          }}
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-[22px] border-[3px] border-[#141414] bg-primary text-[#111418] shadow-[6px_6px_0_#141414] transition-transform duration-150 hover:-translate-y-1"
        >
          <span className="text-xl font-semibold leading-none">AI</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          className={cn(
            'fixed flex flex-col overflow-hidden pointer-events-auto transition-all duration-300 border-[3px] border-[#141414] bg-[#fffdf4] text-[#111418] shadow-[12px_12px_0_#141414]',
            isMinimized ? 'rounded-[26px]' : 'rounded-[28px]'
          )}
          style={{
            width: `${isMinimized ? resolvedMinimizedWidth : resolvedExpandedWidth}px`,
            height: `${isMinimized ? resolvedMinimizedHeight : resolvedExpandedHeight}px`,
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {/* Header */}
          <div
            data-drag-handle
            className={cn(
              'flex items-center justify-between bg-[#ffdf6b] px-4 py-3 cursor-grab active:cursor-grabbing select-none',
              isMinimized ? 'rounded-[24px] border-[3px] border-[#141414]' : 'rounded-t-[26px] border-b-[3px] border-[#141414]'
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#141414] bg-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">Atlas</span>
                <span className="text-xs text-muted-foreground">
                  {isMinimized ? 'Tap to restore or drag to move' : 'Drag anywhere to move me'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 rounded-[12px] border-[2px] border-[#141414] bg-white/80 p-0 text-[#141414] hover:bg-white"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                  setHasPositioned(false)
                }}
                className="h-7 w-7 rounded-[12px] border-[2px] border-[#141414] bg-white/80 p-0 text-[#141414] hover:bg-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground border-[2px] border-[#141414] shadow-[4px_4px_0_rgba(20,20,20,0.6)]'
                        : 'bg-white text-foreground border-[2px] border-[#141414] shadow-[4px_4px_0_rgba(20,20,20,0.35)]'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-4 w-4 text-[#141414] mt-0.5 flex-shrink-0" />
                      )}
                      {message.role === 'user' && (
                        <User className="h-4 w-4 text-[#141414] mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {/* Action buttons */}
                        {message.metadata?.actions && message.metadata.actions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.metadata.actions.map((action, idx) => (
                              <a
                                key={idx}
                                href={String(action.data?.path ?? '#')}
                                className="inline-flex items-center text-xs px-2 py-1 rounded-full border-[2px] border-[#141414] bg-primary/30 hover:bg-primary/50 text-[#141414]"
                              >
                                {action.label}
                              </a>
                            ))}
                          </div>
                        )}
                        
                        {/* Suggestions */}
                        {message.metadata?.suggestions && (
                          <div className="mt-2 space-y-1">
                            {message.metadata.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => setInputMessage(suggestion)}
                                className="block w-full text-left text-xs rounded-full border-[2px] border-[#141414] bg-white px-2 py-1 text-[#141414] transition-colors hover:bg-primary/40"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-full border-[2px] border-[#141414] bg-primary/60 px-3 py-2 text-xs font-medium text-[#141414]">
                    typing...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          {!isMinimized && (
            <div className="p-4 border-t-[3px] border-[#141414] bg-[#fff7d6] rounded-b-[26px]">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-white text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

