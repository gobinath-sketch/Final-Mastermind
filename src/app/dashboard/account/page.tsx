"use client"

import { useCallback, useState } from "react"
import { Mail, UserPlus, Lock, RefreshCw, Repeat } from "lucide-react"
import { ActionCard } from "@/components/ActionCard"
import { Button } from "@/components/ui/button"
import { useToast } from "@/shared/hooks/use-toast"
import * as Dialog from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/context/AuthContext"

export default function AccountActionsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const withLoading = useCallback(async (key: string, fn: () => Promise<void>) => {
    try {
      setLoadingKey(key)
      await fn()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Please try again.'
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive"
      })
    } finally {
      setLoadingKey((k) => (k === key ? null : k))
    }
  }, [toast])

  const sendEmailConfirmation = useCallback(async () => {
    await withLoading("confirm", async () => {
      // Mock for now as we migrated to MongoDB
      await new Promise(r => setTimeout(r, 1000))
      toast({ title: "Confirmation sent", description: "Check your inbox (Simulation)." })
    })
  }, [toast, withLoading])

  const [inviteEmail, setInviteEmail] = useState("")
  const inviteUser = useCallback(async () => {
    await withLoading("invite", async () => {
      if (!inviteEmail) throw new Error("Email is required")
      await new Promise(r => setTimeout(r, 1000))
      toast({ title: "Invite sent", description: `Invitation sent to ${inviteEmail} (Simulation)` })
      setInviteEmail("")
    })
  }, [inviteEmail, toast, withLoading])

  const reauthenticate = useCallback(async () => {
    await withLoading("reauth", async () => {
      await new Promise(r => setTimeout(r, 1000))
      toast({ title: "Check your email", description: "We sent a login link (Simulation)." })
    })
  }, [toast, withLoading])

  const [resetEmail, setResetEmail] = useState("")
  const resetPassword = useCallback(async () => {
    await withLoading("reset", async () => {
      if (!resetEmail) throw new Error("Email is required")
      await new Promise(r => setTimeout(r, 1000))
      toast({ title: "Reset link sent", description: "Check your inbox (Simulation)." })
      setResetEmail("")
    })
  }, [resetEmail, toast, withLoading])

  const [newEmail, setNewEmail] = useState("")
  const changeEmail = useCallback(async () => {
    await withLoading("changeEmail", async () => {
      if (!newEmail) throw new Error("Email is required")
      await new Promise(r => setTimeout(r, 1000))
      toast({ title: "Verify new email", description: "Confirm via email link (Simulation)." })
      setNewEmail("")
    })
  }, [newEmail, toast, withLoading])

  return (
    <div className="min-h-[calc(100vh-120px)] bg-transparent">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6 text-foreground">Account Actions</h1>
        <p className="text-muted-foreground mb-10">Professional, minimal, 3D-glass actions with subtle motion.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <ActionCard
            icon={Mail}
            title="Confirm Email"
            description="Verify your email address to continue."
            className="bg-secondary/50 border-border"
          >
            <Button onClick={sendEmailConfirmation} disabled={loadingKey === "confirm"}>
              {loadingKey === "confirm" ? "Sending..." : "Send Link"}
            </Button>
          </ActionCard>

          <ActionCard
            icon={UserPlus}
            title="Invite User"
            description="Share a secure invite link."
            className="bg-secondary/50 border-border"
          >
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button disabled={loadingKey === "invite"}>{loadingKey === "invite" ? "Inviting..." : "Invite"}</Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl bg-secondary border border-border p-5 backdrop-blur-xl text-foreground z-50">
                  <Dialog.Title className="text-lg font-semibold">Invite user</Dialog.Title>
                  <p className="text-sm text-muted-foreground mt-1">Enter an email to send an invitation.</p>
                  <div className="mt-4">
                    <Input type="email" placeholder="name@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-background border-input" />
                    {!inviteEmail && <p className="text-xs text-red-400 mt-1">Email is required.</p>}
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button variant="ghost" className="bg-transparent border border-input text-foreground">Cancel</Button>
                    </Dialog.Close>
                    <Button onClick={inviteUser} disabled={loadingKey === "invite" || !inviteEmail}>Send invite</Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </ActionCard>

          <ActionCard
            icon={Lock}
            title="Re-authentication"
            description="Confirm it’s really you."
            className="bg-secondary/50 border-border"
          >
            <Button onClick={reauthenticate} disabled={loadingKey === "reauth"}>
              {loadingKey === "reauth" ? "Sending..." : "Send OTP"}
            </Button>
          </ActionCard>

          <ActionCard
            icon={RefreshCw}
            title="Reset Password"
            description="Get a secure reset link."
            className="bg-secondary/50 border-border"
          >
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button disabled={loadingKey === "reset"}>{loadingKey === "reset" ? "Sending..." : "Reset"}</Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl bg-secondary border border-border p-5 backdrop-blur-xl text-foreground z-50">
                  <Dialog.Title className="text-lg font-semibold">Reset password</Dialog.Title>
                  <p className="text-sm text-muted-foreground mt-1">We will email a secure reset link.</p>
                  <div className="mt-4">
                    <Input type="email" placeholder="your@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="bg-background border-input" />
                    {!resetEmail && <p className="text-xs text-red-400 mt-1">Email is required.</p>}
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button variant="ghost" className="bg-transparent border border-input text-foreground">Cancel</Button>
                    </Dialog.Close>
                    <Button onClick={resetPassword} disabled={loadingKey === "reset" || !resetEmail}>Send link</Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </ActionCard>

          <ActionCard
            icon={Repeat}
            title="Change Email"
            description="Switch to another address."
            className="bg-secondary/50 border-border"
          >
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button disabled={loadingKey === "changeEmail"}>{loadingKey === "changeEmail" ? "Updating..." : "Change"}</Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl bg-secondary border border-border p-5 backdrop-blur-xl text-foreground z-50">
                  <Dialog.Title className="text-lg font-semibold">Change email</Dialog.Title>
                  <p className="text-sm text-muted-foreground mt-1">Enter the new email to switch to.</p>
                  <div className="mt-4">
                    <Input type="email" placeholder="new@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-background border-input" />
                    {!newEmail && <p className="text-xs text-red-400 mt-1">Email is required.</p>}
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button variant="ghost" className="bg-transparent border border-input text-foreground">Cancel</Button>
                    </Dialog.Close>
                    <Button onClick={changeEmail} disabled={loadingKey === "changeEmail" || !newEmail}>Update</Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </ActionCard>
        </div>
      </div>
    </div>
  )
}
