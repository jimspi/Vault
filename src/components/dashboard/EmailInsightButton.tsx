'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface EmailInsightButtonProps {
  insightIds: string[];
  variant?: 'single' | 'bulk';
  size?: 'sm' | 'default' | 'lg';
}

export default function EmailInsightButton({
  insightIds,
  variant = 'single',
  size = 'sm'
}: EmailInsightButtonProps) {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleEmail = async () => {
    setSending(true);

    try {
      const response = await fetch('/api/insights/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      const data = await response.json();

      toast({
        title: 'Email Sent!',
        description: data.message,
      });
    } catch (error) {
      toast({
        title: 'Email Failed',
        description: error instanceof Error ? error.message : 'Could not send insights via email',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant === 'bulk' ? 'default' : 'outline'}
      onClick={handleEmail}
      disabled={sending}
    >
      {sending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="h-4 w-4 mr-2" />
          {variant === 'bulk' ? `Email Selected (${insightIds.length})` : 'Email This'}
        </>
      )}
    </Button>
  );
}
