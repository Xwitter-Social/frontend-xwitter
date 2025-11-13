'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Search, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';

export function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const profileHref = user?.username ? `/profile/${user.username}` : '/profile';
  const navItems = [
    { href: '/timeline', label: 'Timeline', icon: Home },
    { href: '/search', label: 'Buscar', icon: Search },
    { href: '/messages', label: 'Mensagens', icon: MessageCircle },
    { href: profileHref, label: 'Perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card p-2 md:hidden min-h-[64px]">
      <div className="flex justify-around">
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
                size="sm"
                className="flex h-auto flex-col gap-1 py-2"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
