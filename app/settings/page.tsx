'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type {
  ChangeEvent,
  FormEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { Check, Loader2, LogOut, Save, Trash2, X } from 'lucide-react';

import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from '@/hooks/use-toast';
import { deleteAccount, updateAccount } from '@/lib/account-client';
import { signOut } from '@/lib/auth-client';
import { getPasswordValidation, isPasswordCompliant } from '@/lib/password';
import { getInitials } from '@/lib/utils';

interface FormState {
  name: string;
  username: string;
  email: string;
  bio: string;
  password: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  username: '',
  email: '',
  bio: '',
  password: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    isLoading: isUserLoading,
    error: currentUserError,
    mutate,
  } = useCurrentUser();
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  useEffect(() => {
    if (user) {
      setFormState({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        bio: user.bio ?? '',
        password: '',
      });
      setDeleteConfirmationInput('');
      setShowDeleteConfirmation(false);
    } else {
      setFormState(EMPTY_FORM);
    }
  }, [user]);

  const passwordValidation = useMemo(
    () => getPasswordValidation(formState.password),
    [formState.password],
  );
  const isPasswordFilled = formState.password.trim().length > 0;
  const isPasswordStrong = useMemo(
    () => passwordValidation.every((requirement) => requirement.isValid),
    [passwordValidation],
  );
  const isPasswordValidForSubmit = !isPasswordFilled || isPasswordStrong;

  const bioLength = formState.bio.length;

  const hasChanges = useMemo(() => {
    if (!user) {
      return false;
    }

    const trimmedName = formState.name.trim();
    const trimmedUsername = formState.username.trim();
    const trimmedEmail = formState.email.trim();
    const trimmedBio = formState.bio.trim();

    if (
      trimmedName !== user.name ||
      trimmedUsername !== user.username ||
      trimmedEmail !== user.email ||
      trimmedBio !== (user.bio ?? '')
    ) {
      return true;
    }

    if (formState.password.trim().length > 0) {
      return true;
    }

    return false;
  }, [formState, user]);

  const isSaveDisabled = isSaving || !hasChanges || !isPasswordValidForSubmit;

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast({
        variant: 'destructive',
        description: 'Usuário não encontrado. Faça login novamente.',
      });
      return;
    }

    const trimmedName = formState.name.trim();
    const trimmedUsername = formState.username.trim();
    const trimmedEmail = formState.email.trim();
    const normalizedBio = formState.bio.trim();
    const trimmedPassword = formState.password.trim();

    const updates: Record<string, string> = {};

    if (trimmedName !== user.name) {
      updates.name = trimmedName;
    }

    if (trimmedUsername !== user.username) {
      updates.username = trimmedUsername;
    }

    if (trimmedEmail !== user.email) {
      updates.email = trimmedEmail;
    }

    if (normalizedBio !== (user.bio ?? '')) {
      updates.bio = normalizedBio;
    }

    if (trimmedPassword.length > 0) {
      if (!isPasswordCompliant(trimmedPassword)) {
        toast({
          variant: 'destructive',
          description:
            'A nova senha precisa atender a todos os requisitos de segurança.',
        });
        return;
      }

      updates.password = trimmedPassword;
    }

    if (!Object.keys(updates).length) {
      toast({ description: 'Nenhuma alteração para salvar.' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateAccount({
        id: user.id,
        name: updates.name ?? undefined,
        username: updates.username ?? undefined,
        email: updates.email ?? undefined,
        bio: updates.bio ?? undefined,
        password: updates.password ?? undefined,
      });

      await mutate(response.user, false);

      setFormState({
        name: response.user.name,
        username: response.user.username,
        email: response.user.email,
        bio: response.user.bio ?? '',
        password: '',
      });

      toast({
        title: 'Perfil atualizado',
        description: response.message,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o perfil.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setFormState({
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio ?? '',
      password: '',
    });
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      await mutate(null, false);
      toast({ description: 'Sessão encerrada com sucesso.' });
      router.replace('/');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível encerrar a sessão.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || isDeleting) {
      return;
    }

    if (deleteConfirmationInput.trim() !== user.username.trim()) {
      toast({
        variant: 'destructive',
        description: 'Confirmação inválida. Digite seu username completo.',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const message = await deleteAccount(user.id);

      toast({
        title: 'Conta excluída',
        description: message,
      });

      try {
        await signOut();
      } catch {
        // Ignora falhas ao tentar encerrar a sessão após a exclusão.
      }

      await mutate(null, false);
      setShowDeleteConfirmation(false);
      setDeleteConfirmationInput('');
      router.replace('/');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir a conta.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeleteConfirmed = Boolean(
    user &&
      deleteConfirmationInput.trim().toLowerCase() ===
        user.username.trim().toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user ?? undefined} />

      <div className="pb-16 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
            <h1 className="text-xl font-bold text-primary">Configurações</h1>
          </div>
        </header>

        <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
          {isUserLoading && !user ? (
            <div className="space-y-4">
              <div className="h-64 animate-pulse rounded-xl border border-border bg-card/40" />
              <div className="h-48 animate-pulse rounded-xl border border-border bg-card/40" />
            </div>
          ) : null}

          {currentUserError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {currentUserError.message}
            </div>
          ) : null}

          {!isUserLoading && !user && !currentUserError ? (
            <Card>
              <CardHeader>
                <CardTitle>Faça login para continuar</CardTitle>
                <CardDescription>
                  Você precisa estar autenticado para acessar as configurações
                  da conta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.replace('/')}>
                  Ir para login
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!isUserLoading && user ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Editar perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais e mantenha seu perfil
                    sempre atualizado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {getInitials(formState.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Foto do perfil</p>
                        <p className="text-xs text-muted-foreground">
                          Sua foto é gerada automaticamente a partir das suas
                          iniciais.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formState.name}
                          onChange={handleInputChange}
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="username">Nome de usuário</Label>
                        <Input
                          id="username"
                          name="username"
                          value={formState.username}
                          onChange={handleInputChange}
                          placeholder="@seuusername"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formState.email}
                          onChange={handleInputChange}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="bio">Biografia</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formState.bio}
                          onChange={handleInputChange}
                          placeholder="Conte um pouco sobre você..."
                          rows={3}
                          maxLength={160}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          {bioLength}/160 caracteres
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="password">Nova senha</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          value={formState.password}
                          onChange={handleInputChange}
                          placeholder="Preencha para alterar a senha"
                          minLength={8}
                        />
                        {formState.password ? (
                          <div className="mt-2 space-y-1">
                            {passwordValidation.map((requirement) => (
                              <div
                                key={requirement.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                {requirement.isValid ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <X className="h-3 w-3 text-red-500" />
                                )}
                                <span
                                  className={
                                    requirement.isValid
                                      ? 'text-green-500'
                                      : 'text-red-500'
                                  }
                                >
                                  {requirement.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco caso não deseje alterar a senha.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                      <Button
                        type="submit"
                        className="sm:w-auto"
                        disabled={isSaveDisabled}
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {isSaving ? 'Salvando...' : 'Salvar alterações'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="sm:w-auto"
                        onClick={handleReset}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações da conta</CardTitle>
                  <CardDescription>
                    Gerencie ações sensíveis da sua conta. Tenha cuidado ao
                    prosseguir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-3 rounded-md border border-border/60 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">Encerrar sessão</p>
                      <p className="text-sm text-muted-foreground">
                        Finalize sua sessão atual neste dispositivo.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
                    </Button>
                  </div>

                  <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-destructive">
                          Excluir conta
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Esta ação é irreversível. Todos os seus dados serão
                          removidos permanentemente.
                        </p>
                      </div>
                      {!showDeleteConfirmation ? (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setShowDeleteConfirmation(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir conta
                        </Button>
                      ) : null}
                    </div>

                    {showDeleteConfirmation ? (
                      <div className="mt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Digite{' '}
                          <span className="font-semibold">{user.username}</span>{' '}
                          para confirmar a exclusão da conta.
                        </p>
                        <Input
                          name="deleteConfirmation"
                          value={deleteConfirmationInput}
                          onChange={(event) =>
                            setDeleteConfirmationInput(event.target.value)
                          }
                          placeholder="Digite seu username completo"
                          autoFocus
                        />
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={!isDeleteConfirmed || isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowDeleteConfirmation(false);
                              setDeleteConfirmationInput('');
                            }}
                            disabled={isDeleting}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
