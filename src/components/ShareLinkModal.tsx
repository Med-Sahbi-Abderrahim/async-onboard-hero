import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, addDays } from 'date-fns';

interface ShareLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    full_name: string;
    access_token: string;
    access_token_expires_at: string | null;
  };
}

export function ShareLinkModal({ open, onOpenChange, client }: ShareLinkModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const magicLink = `${window.location.origin}/intake/${client.access_token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Magic link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = () => {
    // For now, just copy the link
    handleCopy();
    toast({
      title: 'Email feature coming soon',
      description: 'For now, share the link manually with your client',
    });
  };

  const getExpirationText = () => {
    if (client.access_token_expires_at) {
      const expiresAt = new Date(client.access_token_expires_at);
      return `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;
    }
    return 'Link expires in 90 days';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {client.full_name} has been invited!
          </DialogTitle>
          <DialogDescription className="text-center">
            Share this magic link with your client to give them access to their intake forms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Magic Link</label>
            <div className="flex gap-2">
              <Input value={magicLink} readOnly className="font-mono text-sm" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{getExpirationText()}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button onClick={handleSendEmail} className="flex-1">
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
