import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/ui/language-toggle';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="h-16 border-b border-border bg-background shadow-soft">
      <div className="flex h-full items-center justify-between px-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('search') + '...'}
              className="w-64 pl-10"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Language Toggle */}
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}