'use client';

import type React from 'react';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X } from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { signIn, signUp } from '@/lib/auth-client';

const passwordRequirements = [
  { id: 'length', text: 'Pelo menos 8 caracteres', regex: /.{8,}/ },
  { id: 'uppercase', text: 'Uma letra maiúscula', regex: /[A-Z]/ },
  { id: 'lowercase', text: 'Uma letra minúscula', regex: /[a-z]/ },
  { id: 'number', text: 'Um número', regex: /\d/ },
  { id: 'symbol', text: 'Um símbolo', regex: /[!@#$%^&*(),.?\":{}|<>]/ },
];

function getPasswordValidation(password: string) {
  return passwordRequirements.map((req) => ({
    ...req,
    isValid: req.regex.test(password),
  }));
}

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupBio, setSignupBio] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const passwordValidation = useMemo(
    () => getPasswordValidation(signupPassword),
    [signupPassword],
  );
  const isPasswordValid = useMemo(
    () => passwordValidation.every((req) => req.isValid),
    [passwordValidation],
  );
  const passwordsMatch =
    signupPassword === signupConfirmPassword && signupConfirmPassword !== '';

  const resetLoading = () => setIsLoading(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      await signIn({ identifier: loginIdentifier, password: loginPassword });
      toast({
        title: 'Login realizado',
        description: 'Bem-vindo de volta!',
      });
      router.push('/timeline');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível entrar.';
      toast({
        title: 'Erro ao entrar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      resetLoading();
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      await signUp({
        name: signupName,
        username: signupUsername,
        email: signupEmail,
        bio: signupBio,
        password: signupPassword,
      });
      toast({
        title: 'Conta criada',
        description: 'Agora é só fazer login para começar.',
      });
      setActiveTab('login');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível criar sua conta.';
      toast({
        title: 'Erro ao cadastrar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      resetLoading();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Xwitter</h1>
          <p className="text-muted-foreground">Conecte-se com o mundo</p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value: string) =>
            setActiveTab(value as 'login' | 'signup')
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Fazer Login</CardTitle>
                <CardDescription>
                  Entre com suas credenciais para acessar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Email ou Nome de Usuário</Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="seu@email.com ou @usuario"
                      value={loginIdentifier}
                      onChange={(event) =>
                        setLoginIdentifier(event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(event) =>
                          setLoginPassword(event.target.value)
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={
                          showPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && activeTab === 'login'
                      ? 'Entrando...'
                      : 'Entrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Criar Conta</CardTitle>
                <CardDescription>
                  Preencha os dados para criar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      value={signupName}
                      onChange={(event) => setSignupName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="@joaosilva"
                      value={signupUsername}
                      onChange={(event) =>
                        setSignupUsername(event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="joao@email.com"
                      value={signupEmail}
                      onChange={(event) => setSignupEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Descrição (opcional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Conte um pouco sobre você..."
                      className="resize-none"
                      rows={3}
                      value={signupBio}
                      onChange={(event) => setSignupBio(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(event) =>
                          setSignupPassword(event.target.value)
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowSignupPassword((previous) => !previous)
                        }
                        aria-label={
                          showSignupPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signupPassword && (
                      <div className="space-y-1 mt-2">
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
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(event) =>
                          setSignupConfirmPassword(event.target.value)
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword((previous) => !previous)
                        }
                        aria-label={
                          showConfirmPassword
                            ? 'Ocultar senha'
                            : 'Mostrar senha'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {signupConfirmPassword && (
                      <div className="flex items-center gap-2 text-sm">
                        {passwordsMatch ? (
                          <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">
                              Senhas coincidem
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 text-red-500" />
                            <span className="text-red-500">
                              Senhas não coincidem
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isLoading ||
                      !isPasswordValid ||
                      !passwordsMatch ||
                      !signupPassword
                    }
                  >
                    {isLoading && activeTab === 'signup'
                      ? 'Criando conta...'
                      : 'Criar Conta'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
