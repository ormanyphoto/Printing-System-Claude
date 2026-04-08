import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface VariantMappingsManagerProps {
  productId: string;
}

export default function VariantMappingsManager({ productId }: VariantMappingsManagerProps) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMappings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shopify_variant_mappings')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    setMappings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMappings();
  }, [productId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Shopify Variant Mappings</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchMappings}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : mappings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No variant mappings found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mapping Key</TableHead>
                <TableHead>Shopify Variant ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.mapping_key}</TableCell>
                  <TableCell>{m.shopify_variant_id}</TableCell>
                  <TableCell>
                    <Badge variant={m.enabled ? 'default' : 'secondary'}>
                      {m.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
