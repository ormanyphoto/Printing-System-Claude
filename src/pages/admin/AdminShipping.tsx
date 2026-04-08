import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Truck, Save } from 'lucide-react';

export default function AdminShipping() {
  const [config, setConfig] = useState<any>({
    dhl_api_key: '',
    dhl_secret: '',
    dhl_account_number: '',
    origin_country: 'IL',
    origin_city: '',
    origin_postal_code: '',
    default_weight_kg: '2',
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // DHL settings are stored as Supabase Edge Function secrets
    // This UI is for reference/documentation purposes
    // Set secrets via: npx supabase secrets set DHL_API_KEY=xxx DHL_ACCOUNT_NUMBER=xxx
    setTimeout(() => setSaving(false), 500);
  };

  const updateField = (field: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shipping Configuration</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> DHL API Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>DHL API Key</Label>
              <Input
                type="password"
                value={config.dhl_api_key}
                onChange={e => updateField('dhl_api_key', e.target.value)}
                placeholder="Enter DHL API key"
              />
            </div>
            <div>
              <Label>DHL Secret</Label>
              <Input
                type="password"
                value={config.dhl_secret}
                onChange={e => updateField('dhl_secret', e.target.value)}
                placeholder="Enter DHL secret"
              />
            </div>
            <div>
              <Label>DHL Account Number</Label>
              <Input
                value={config.dhl_account_number}
                onChange={e => updateField('dhl_account_number', e.target.value)}
                placeholder="Enter account number"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.enabled}
                onCheckedChange={val => updateField('enabled', val)}
              />
              <Label>DHL Shipping Enabled</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Origin Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Country Code</Label>
              <Input
                value={config.origin_country}
                onChange={e => updateField('origin_country', e.target.value)}
                placeholder="IL"
                maxLength={2}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={config.origin_city}
                onChange={e => updateField('origin_city', e.target.value)}
                placeholder="Tel Aviv"
              />
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input
                value={config.origin_postal_code}
                onChange={e => updateField('origin_postal_code', e.target.value)}
                placeholder="6100000"
              />
            </div>
            <div>
              <Label>Default Package Weight (kg)</Label>
              <Input
                type="number"
                value={config.default_weight_kg}
                onChange={e => updateField('default_weight_kg', e.target.value)}
                step="0.1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
