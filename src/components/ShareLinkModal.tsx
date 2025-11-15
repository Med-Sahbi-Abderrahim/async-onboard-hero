import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    full_name: string;
    email: string;
  };
}

export function ShareLinkModal({ open, onOpenChange, client }: ShareLinkModalProps) {
  const { toast } = useToast();

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
            A magic link has been sent to <strong>{client.email}</strong> to access their client portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email Sent</p>
                <p className="text-xs text-muted-foreground">
                  Your client will receive a secure magic link to access their portal.
                  They can use this link to authenticate and access all their files, contracts, and forms.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
