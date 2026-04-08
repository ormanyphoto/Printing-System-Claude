import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminSizes() {
  const [sizes, setSizes] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('size_presets')
      .select('*, products(name_en)')
      .order('sort_order')
      .then(({ data }) => setSizes(data || []));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this size preset?')) return;
    await supabase.from('size_presets').delete().eq('id', id);
    setSizes(sizes.filter(s => s.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Size Presets</h1>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Size</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Width (cm)</TableHead>
                <TableHead>Height (cm)</TableHead>
                <TableHead>Aspect Ratio</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizes.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.width_cm}</TableCell>
                  <TableCell>{s.height_cm}</TableCell>
                  <TableCell className="text-muted-foreground">{s.aspect_ratio || `${s.width_cm}:${s.height_cm}`}</TableCell>
                  <TableCell>{s.products?.name_en || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={s.enabled ? 'default' : 'secondary'}>
                      {s.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
