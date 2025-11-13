'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Search, Settings, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User as UserType } from '@/types/user';
import { getInitials } from '@/lib/utils';

interface NavigationProps {
  user?: UserType | null;
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const profileHref = user?.username ? `/profile/${user.username}` : '/profile';
  const navItems = [
    { href: '/timeline', label: 'Timeline', icon: Home },
    { href: profileHref, label: 'Perfil', icon: User },
    { href: '/messages', label: 'Mensagens', icon: MessageCircle },
    { href: '/search', label: 'Buscar', icon: Search },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <nav className="fixed left-0 top-0 hidden h-full w-64 border-r border-border bg-card p-4 md:block">
      <div className="space-y-6">
        <div className="px-3">
          <h1 className="text-2xl font-bold text-primary">Xwitter</h1>
        </div>

        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.label === 'Perfil' && pathname.startsWith('/profile'));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3 text-base"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Link href={profileHref}>
            <Button variant="ghost" className="w-full justify-start gap-3 p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium">{user?.name ?? 'Você'}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.username ? `@${user.username}` : '@voce'}
                </p>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
