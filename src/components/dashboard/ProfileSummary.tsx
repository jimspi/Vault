'use client';

import { useEffect, useState } from 'react';
import { User, Target, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  summary: string;
  interests: string[];
  goals: string[];
  patterns: string[];
  characteristics: string[];
}

interface ProfileSummaryProps {
  workspaceId: string;
}

export default function ProfileSummary({ workspaceId }: ProfileSummaryProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile?workspaceId=${workspaceId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        setProfile(data.profile);
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [workspaceId]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analyzing your vault...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <User className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Start uploading documents and creating insights to see your AI-generated profile
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>What I've Learned About You</span>
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            AI Profile
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {profile.summary && (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-foreground/90">
              {profile.summary}
            </p>
          </div>
        )}

        {/* Interests, Goals, Patterns, Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-semibold">Your Interests</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {profile.goals && profile.goals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <h4 className="text-sm font-semibold">Your Goals</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.goals.map((goal, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20"
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {profile.patterns && profile.patterns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <h4 className="text-sm font-semibold">Patterns I Notice</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.patterns.map((pattern, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  >
                    {pattern}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Characteristics */}
          {profile.characteristics && profile.characteristics.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-500" />
                <h4 className="text-sm font-semibold">Key Characteristics</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.characteristics.map((char, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20"
                  >
                    {char}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
