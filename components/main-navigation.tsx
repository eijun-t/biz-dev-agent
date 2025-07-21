'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, BarChart3, FileText, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MainNavigationProps {
  user?: SupabaseUser | null;
}

export function MainNavigation({ user }: MainNavigationProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(user || null);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      // Get current user if not provided
      supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
      });
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [user, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* ロゴ・ブランド */}
        <Link href="/" className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">BizDev AI</span>
        </Link>

        {/* メインナビゲーション */}
        <nav className="hidden md:flex items-center space-x-1">
          <Button
            variant={isActive('/') ? 'default' : 'ghost'}
            size="sm"
            asChild
          >
            <Link href="/" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>新規レポート</span>
            </Link>
          </Button>
          
          {currentUser && (
            <Button
              variant={isActive('/dashboard') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link href="/dashboard" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>ダッシュボード</span>
              </Link>
            </Button>
          )}
        </nav>

        {/* ユーザーメニュー */}
        <div className="flex items-center space-x-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {currentUser.email?.split('@')[0] || 'ユーザー'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>ダッシュボード</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">ログイン</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">新規登録</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}