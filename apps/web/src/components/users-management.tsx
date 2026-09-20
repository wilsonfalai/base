"use client"

import { useEffect, useState, type FormEvent } from "react"
import type { UserRole } from "@base-app/auth/permissions"
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconPlus,
  IconSearch,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
type UserSheetState =
  | { mode: "create" }
  | { mode: "edit" | "view"; user: ListedUser }

function getUserRole(user: ListedUser): UserRole {
  return user.role === "admin" ? "admin" : "collaborator"
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function UsersManagement({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ListedUser[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null)
  const [sheetState, setSheetState] = useState<UserSheetState | null>(null)
  const [formRole, setFormRole] = useState<UserRole>("collaborator")
  const [isSaving, setIsSaving] = useState(false)
  const [pendingStatusUser, setPendingStatusUser] =
    useState<ListedUser | null>(null)
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

  function refreshUsers() {
    setIsLoading(true)
    setRefreshKey((value) => value + 1)
  }

  function openCreateSheet() {
    setFormRole("collaborator")
    setSheetState({ mode: "create" })
  }

  function openUserSheet(mode: "edit" | "view", user: ListedUser) {
    setFormRole(getUserRole(user))
    setSheetState({ mode, user })
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sheetState || sheetState.mode === "view") return

    setIsSaving(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get("email")).trim()
    const name = String(formData.get("name")).trim()

    if (sheetState.mode === "create") {
      const result = await authClient.admin.createUser({
        email,
        name,
        password: String(formData.get("password")),
        role: formRole,
      })

      setIsSaving(false)
      if (result.error) {
        toast.error("Não foi possível criar o usuário.")
        return
      }

      form.reset()
      setSheetState(null)
      setOffset(0)
      refreshUsers()
      toast.success("Usuário criado com sucesso.")
      return
    }

    const user = sheetState.user
    const updateResult = await authClient.admin.updateUser({
      data: { email, name },
      userId: user.id,
    })

    if (updateResult.error) {
      setIsSaving(false)
      toast.error("Não foi possível editar o usuário.")
      return
    }

    const currentRole = getUserRole(user)
    if (user.id !== currentUserId && formRole !== currentRole) {
      const roleResult = await authClient.admin.setRole({
        role: formRole,
        userId: user.id,
      })

      if (roleResult.error) {
        setIsSaving(false)
        refreshUsers()
        toast.error("Os dados foram salvos, mas o perfil não foi alterado.")
        return
      }
    }

    setIsSaving(false)
    setSheetState(null)
    refreshUsers()
    toast.success("Usuário atualizado com sucesso.")
  }

  async function handleStatusChange() {
    const user = pendingStatusUser
    if (!user) return

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

    setPendingStatusUser(null)
    toast.success(user.banned ? "Usuário ativado." : "Usuário inativado.")
    refreshUsers()
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setLoadError(false)
    setOffset(0)
    setAppliedSearch(search.trim())
    setRefreshKey((value) => value + 1)
  }

  const selectedUser =
    sheetState && sheetState.mode !== "create" ? sheetState.user : null
  const isViewMode = sheetState?.mode === "view"
  const isCurrentUserSelected = selectedUser?.id === currentUserId

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Usuários</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o acesso da equipe e mantenha apenas usuários ativos.
          </p>
        </div>

        <Button onClick={openCreateSheet}>
          <IconPlus />
          Novo usuário
        </Button>
      </div>

      <form className="flex max-w-md gap-2" onSubmit={handleSearch}>
        <div className="relative flex-1">
          <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
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
              <TableHead className="w-14 text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
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
                      setLoadError(false)
                      refreshUsers()
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
                const role = getUserRole(user)

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
                    <TableCell>{ROLE_LABELS[role]}</TableCell>
                    <TableCell>
                      <Badge variant={user.banned ? "outline" : "secondary"}>
                        {user.banned ? "Inativo" : "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label={`Ações de ${user.name}`}
                            disabled={mutatingUserId === user.id}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <IconDotsVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onSelect={() => openUserSheet("view", user)}
                          >
                            <IconEye />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => openUserSheet("edit", user)}
                          >
                            <IconPencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={isCurrentUser}
                            variant={user.banned ? "default" : "destructive"}
                            onSelect={() => setPendingStatusUser(user)}
                          >
                            {user.banned ? <IconUserCheck /> : <IconUserOff />}
                            {user.banned ? "Ativar" : "Inativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <Sheet
        open={sheetState !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setSheetState(null)
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <form
            key={sheetState?.mode === "create" ? "create" : selectedUser?.id}
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleSave}
          >
            <SheetHeader className="border-b px-6 py-5">
              <SheetTitle>
                {sheetState?.mode === "create"
                  ? "Novo usuário"
                  : isViewMode
                    ? "Detalhes do usuário"
                    : "Editar usuário"}
              </SheetTitle>
              <SheetDescription>
                {sheetState?.mode === "create"
                  ? "Crie o acesso interno e compartilhe a senha temporária por um canal seguro."
                  : isViewMode
                    ? "Consulte os dados e o estado de acesso deste usuário."
                    : "Atualize os dados cadastrais e o perfil de acesso."}
              </SheetDescription>
            </SheetHeader>

            {isViewMode && selectedUser ? (
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium break-all">{selectedUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-6 border-y py-5">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Perfil</p>
                    <p className="font-medium">
                      {ROLE_LABELS[getUserRole(selectedUser)]}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={selectedUser.banned ? "outline" : "secondary"}
                    >
                      {selectedUser.banned ? "Inativo" : "Ativo"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Atualizado em</p>
                  <p className="font-medium">
                    {formatDate(selectedUser.updatedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="user-name">Nome</Label>
                  <Input
                    defaultValue={selectedUser?.name}
                    id="user-name"
                    name="name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-email">E-mail</Label>
                  <Input
                    defaultValue={selectedUser?.email}
                    id="user-email"
                    name="email"
                    type="email"
                    required
                  />
                </div>
                {sheetState?.mode === "create" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="user-password">Senha temporária</Label>
                    <Input
                      autoComplete="new-password"
                      id="user-password"
                      minLength={8}
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="user-role">Perfil</Label>
                  <Select
                    disabled={isCurrentUserSelected}
                    value={formRole}
                    onValueChange={(value) => setFormRole(value as UserRole)}
                  >
                    <SelectTrigger id="user-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collaborator">Colaborador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCurrentUserSelected ? (
                    <p className="text-xs text-muted-foreground">
                      Seu próprio perfil não pode ser alterado aqui.
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-end">
              <SheetClose asChild>
                <Button disabled={isSaving} type="button" variant="outline">
                  {isViewMode ? "Fechar" : "Cancelar"}
                </Button>
              </SheetClose>
              {!isViewMode ? (
                <Button disabled={isSaving} type="submit">
                  {isSaving
                    ? "Salvando..."
                    : sheetState?.mode === "create"
                      ? "Criar usuário"
                      : "Salvar alterações"}
                </Button>
              ) : null}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingStatusUser !== null}
        onOpenChange={(open) => {
          if (!open && !mutatingUserId) setPendingStatusUser(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatusUser?.banned
                ? "Ativar usuário?"
                : "Inativar usuário?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusUser?.banned
                ? `${pendingStatusUser.name} poderá entrar novamente no sistema.`
                : `${pendingStatusUser?.name} perderá o acesso e todas as sessões serão encerradas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutatingUserId !== null}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutatingUserId !== null}
              onClick={(event) => {
                event.preventDefault()
                void handleStatusChange()
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
