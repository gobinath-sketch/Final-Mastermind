'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackToDashboardButton({ className = "" }: { className?: string }) {
    const router = useRouter()

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className={`text-gray-300 hover:text-white hover:bg-white/10 ${className}`}
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
        </Button>
    )
}
