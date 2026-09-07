"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

const INVALID_CREDENTIALS_MESSAGE =
  "Não foi possível entrar. Verifique seu e-mail e sua senha."

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email"))
    const password = String(formData.get("password"))

    try {
      const result = await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(INVALID_CREDENTIALS_MESSAGE)
        return
      }

      router.replace("/dashboard")
      router.refresh()
    } catch {
      setError(INVALID_CREDENTIALS_MESSAGE)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Acesse sua conta</CardTitle>
          <CardDescription>
            Use o e-mail e a senha fornecidos pelo administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </Field>
              <div aria-live="polite" className="min-h-5">
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <Field>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Entrando..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
