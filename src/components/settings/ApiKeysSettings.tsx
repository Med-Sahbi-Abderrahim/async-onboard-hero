import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
}

export function ApiKeysSettings() {
  const { toast } = useToast();
  const [apiKeys] = useState<ApiKey[]>([]);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  const toggleShowKey = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 8)}${'•'.repeat(24)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to your organization
              </CardDescription>
            </div>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to start using the API
              </p>
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{apiKey.name}</h4>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={showKey[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                        readOnly
                        className="font-mono text-sm max-w-md"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleShowKey(apiKey.id)}
                      >
                        {showKey[apiKey.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyKey(apiKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created on {new Date(apiKey.created_at).toLocaleDateString()}
                      {apiKey.last_used && ` • Last used ${new Date(apiKey.last_used).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base">API Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            API key management and documentation are coming soon. You'll be able to generate keys and access comprehensive API documentation.
          </p>
          <Button variant="outline" disabled>
            View API Docs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
