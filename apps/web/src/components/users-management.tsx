"use client"

import { useEffect, useState, type FormEvent } from "react"
import type { UserRole } from "@mosaicgestao/auth/permissions"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"

const PAGE_SIZE = 20
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  collaborator: "Colaborador",
}

type ListUsersResult = NonNullable<
  Awaited<ReturnType<typeof authClient.admin.listUsers>>["data"]
>
type ListedUser = ListUsersResult["users"][number]

export function UsersManagement({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ListedUser[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newRole, setNewRole] = useState<UserRole>("collaborator")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    void authClient.admin
      .listUsers({
        query: {
          limit: PAGE_SIZE,
          offset,
          searchField: "email",
          searchOperator: "contains",
          searchValue: appliedSearch || undefined,
          sortBy: "name",
          sortDirection: "asc",
        },
      })
      .then((result) => {
        if (cancelled) return

        if (result.error || !result.data) {
          setLoadError(true)
          setIsLoading(false)
          return
        }

        setUsers(result.data.users)
        setTotal(result.data.total)
        setLoadError(false)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [appliedSearch, offset, refreshKey])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const result = await authClient.admin.createUser({
      email: String(formData.get("email")),
      name: String(formData.get("name")),
      password: String(formData.get("password")),
      role: newRole,
    })

    setIsCreating(false)

    if (result.error) {
      toast.error("Não foi possível criar o usuário.")
      return
    }

    form.reset()
    setNewRole("collaborator")
    setIsCreateOpen(false)
    setOffset(0)
    setIsLoading(true)
    setRefreshKey((value) => value + 1)
    toast.success("Usuário criado com sucesso.")
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    setMutatingUserId(userId)
    const result = await authClient.admin.setRole({ role, userId })
    setMutatingUserId(null)

    if (result.error) {
      toast.error("Não foi possível alterar o perfil.")
      return
    }

    toast.success("Perfil atualizado.")
    setIsLoading(true)
    setRefreshKey((value) => value + 1)
  }

  async function handleStatusChange(user: ListedUser) {
    setMutatingUserId(user.id)
    const result = user.banned
      ? await authClient.admin.unbanUser({ userId: user.id })
      : await authClient.admin.banUser({
          banReason: "Inativado pelo administrador",
          userId: user.id,
        })
    setMutatingUserId(null)

    if (result.error) {
      toast.error("Não foi possível alterar o status do usuário.")
      return
    }

    toast.success(user.banned ? "Usuário ativado." : "Usuário inativado.")
    setIsLoading(true)
    setRefreshKey((value) => value + 1)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setLoadError(false)
    setOffset(0)
    setAppliedSearch(search.trim())
    setRefreshKey((value) => value + 1)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Usuários</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o acesso da equipe e mantenha apenas usuários ativos.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus />
              Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Novo usuário</DialogTitle>
                <DialogDescription>
                  Crie o acesso interno e compartilhe a senha temporária por um
                  canal seguro.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="new-user-name">Nome</Label>
                  <Input id="new-user-name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-user-email">E-mail</Label>
                  <Input id="new-user-email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-user-password">Senha temporária</Label>
                  <Input
                    autoComplete="new-password"
                    id="new-user-password"
                    minLength={8}
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-user-role">Perfil</Label>
                  <Select
                    value={newRole}
                    onValueChange={(value) => setNewRole(value as UserRole)}
                  >
                    <SelectTrigger id="new-user-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collaborator">Colaborador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button disabled={isCreating} type="submit">
                  {isCreating ? "Criando..." : "Criar usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <form className="flex max-w-md gap-2" onSubmit={handleSearch}>
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar por e-mail"
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por e-mail"
            value={search}
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            ) : loadError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center">
                  <p className="text-sm text-destructive">
                    Não foi possível carregar os usuários.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsLoading(true)
                      setLoadError(false)
                      setRefreshKey((value) => value + 1)
                    }}
                  >
                    Tentar novamente
                  </Button>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const role = user.role === "admin" ? "admin" : "collaborator"

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isCurrentUser ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Você
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        disabled={isCurrentUser || mutatingUserId === user.id}
                        value={role}
                        onValueChange={(value) =>
                          void handleRoleChange(user.id, value as UserRole)
                        }
                      >
                        <SelectTrigger
                          aria-label={`Perfil de ${user.name}`}
                          className="w-40"
                          size="sm"
                        >
                          <SelectValue>{ROLE_LABELS[role]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="collaborator">Colaborador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.banned ? "outline" : "secondary"}>
                        {user.banned ? "Inativo" : "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={isCurrentUser || mutatingUserId === user.id}
                            size="sm"
                            variant="ghost"
                          >
                            {user.banned ? "Ativar" : "Inativar"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user.banned ? "Ativar usuário?" : "Inativar usuário?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {user.banned
                                ? `${user.name} poderá entrar novamente no sistema.`
                                : `${user.name} perderá o acesso e todas as sessões serão encerradas.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleStatusChange(user)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>{total === 1 ? "1 usuário" : `${total} usuários`}</span>
        <div className="flex gap-2">
          <Button
            disabled={isLoading || offset === 0}
            size="sm"
            variant="outline"
            onClick={() => {
              setIsLoading(true)
              setOffset((value) => Math.max(0, value - PAGE_SIZE))
            }}
          >
            Anterior
          </Button>
          <Button
            disabled={isLoading || offset + PAGE_SIZE >= total}
            size="sm"
            variant="outline"
            onClick={() => {
              setIsLoading(true)
              setOffset((value) => value + PAGE_SIZE)
            }}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
