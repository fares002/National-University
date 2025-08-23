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
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-4">

          {/* Language Toggle */}
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}