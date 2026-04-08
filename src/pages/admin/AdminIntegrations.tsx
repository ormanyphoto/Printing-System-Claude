import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, ExternalLink } from 'lucide-react';

export default function AdminIntegrations() {
  const [config, setConfig] = useState<any>({
    store_domain: '',
    client_id: '',
    client_secret: '',
    admin_api_token: '',
    api_version: '2024-01',
    oauth_scopes: 'read_orders,write_orders,read_draft_orders,write_draft_orders',
    enabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  useEffect(() => {
    (supabase.from('shopify_config') as any)
      .select('*')
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setConfig(data);
          setConfigId(data.id);
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, created_at, updated_at, ...rest } = config;
      if (configId) {
        await (supabase.from('shopify_config') as any).update(rest).eq('id', configId);
      } else {
        const { data } = await (supabase.from('shopify_config') as any).insert(rest).select().single();
        if (data) setConfigId(data.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Integrations</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Shopify Integration</CardTitle>
                <CardDescription>Connect your Shopify store for product and order sync.</CardDescription>
              </div>
              <Badge variant={config.enabled ? 'default' : 'secondary'}>
                {config.enabled ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Store Domain</Label>
                <Input
                  value={config.store_domain}
                  onChange={e => updateField('store_domain', e.target.value)}
                  placeholder="your-store.myshopify.com"
                />
              </div>
              <div>
                <Label>API Version</Label>
                <Input
                  value={config.api_version}
                  onChange={e => updateField('api_version', e.target.value)}
                  placeholder="2024-01"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Client ID</Label>
                <Input
                  value={config.client_id}
                  onChange={e => updateField('client_id', e.target.value)}
                  placeholder="Enter Client ID"
                />
              </div>
              <div>
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={config.client_secret}
                  onChange={e => updateField('client_secret', e.target.value)}
                  placeholder="Enter Client Secret"
                />
              </div>
            </div>

            <div>
              <Label>Admin API Token</Label>
              <Input
                type="password"
                value={config.admin_api_token}
                onChange={e => updateField('admin_api_token', e.target.value)}
                placeholder="shpat_xxxxx"
              />
            </div>

            <div>
              <Label>OAuth Scopes</Label>
              <Input
                value={config.oauth_scopes}
                onChange={e => updateField('oauth_scopes', e.target.value)}
                placeholder="read_orders,write_orders"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={config.enabled}
                onCheckedChange={val => updateField('enabled', val)}
              />
              <Label>Enable Integration</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-1 h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              {config.store_domain && (
                <Button variant="outline" asChild>
                  <a href={`https://${config.store_domain}/admin`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-4 w-4" /> Open Shopify Admin
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
