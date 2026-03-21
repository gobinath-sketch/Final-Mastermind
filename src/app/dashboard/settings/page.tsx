'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/shared/hooks/use-toast'
import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BackToDashboardButton } from '@/components/BackToDashboardButton'

export default function SettingsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const [theme, setTheme] = useState<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'dark') : 'dark'
  )

  const changePassword = async () => {
    try {
      setLoadingKey('pwd')
      if (!newPassword || newPassword.length < 8) {
        toast({ title: 'Weak password', description: 'Use at least 8 characters.', variant: 'destructive' })
        return
      }

      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to update')

      setNewPassword('')
      toast({ title: 'Password updated' })
    } catch (e: unknown) {
      const message = (e instanceof Error) ? e.message : 'Try again'
      toast({ title: 'Failed to update password', description: message, variant: 'destructive' })
    } finally {
      setLoadingKey(null)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setLoadingKey('del')
      const res = await fetch('/api/auth/delete', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) throw new Error(json?.error || 'Failed to delete')

      toast({ title: 'Account deleted', description: 'Redirecting to sign up...' })
      router.push('/signup')
    } catch (e: unknown) {
      const message = (e instanceof Error) ? e.message : 'Try again'
      toast({ title: 'Delete failed', description: message, variant: 'destructive' })
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <BackToDashboardButton />
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm text-white/80 mb-1">Display name</label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-gray-900/40 border-white/15 focus:border-white/30 text-white"
                placeholder="Your name"
              />
            </div>
            <Button onClick={() => toast({ title: 'Saved', description: 'Settings updated.' })}>Save</Button>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Change Password</h3>
              <div className="flex gap-2 max-w-sm">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-900/40 border-white/15 focus:border-white/30 text-white"
                  placeholder="New password"
                />
                <Button onClick={changePassword} disabled={loadingKey === 'pwd'}>
                  {loadingKey === 'pwd' ? 'Saving...' : 'Update'}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button variant="destructive">Delete account</Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-xl bg-gray-900 border border-white/10 p-6 shadow-xl z-50 text-white">
                    <Dialog.Title className="text-lg font-semibold text-red-400">Delete account</Dialog.Title>
                    <Dialog.Description className="text-sm text-white/70 mt-2">
                      This action cannot be undone. All your data will be permanently removed.
                    </Dialog.Description>
                    <div className="mt-6 flex justify-end gap-3">
                      <Dialog.Close asChild>
                        <Button variant="ghost" className="hover:bg-white/10 text-white">Cancel</Button>
                      </Dialog.Close>
                      <Button
                        variant="destructive"
                        disabled={loadingKey === 'del'}
                        onClick={handleDeleteAccount}
                      >
                        {loadingKey === 'del' ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
