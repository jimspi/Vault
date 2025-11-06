'use client';

import Link from 'next/link';
import { Brain, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Profile, Workspace } from '@/types';
import { signOut } from '@/lib/auth/actions';

interface DashboardNavProps {
  profile: Profile;
  workspaces: Workspace[];
}

export default function DashboardNav({ profile, workspaces: _workspaces }: DashboardNavProps) {
  // Settings moved to right sidebar in DashboardLayout

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Vault</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {profile.full_name || profile.email}
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
