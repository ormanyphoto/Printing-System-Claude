import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminPriceTiers() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('price_tiers')
      .select('*, products(name_en), product_subtypes(name_en)')
      .order('min_area_sqcm')
      .then(({ data }) => setItems(data || []));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this price tier?')) return;
    await supabase.from('price_tiers').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Price Tiers</h1>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Price Tier</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Subtype</TableHead>
                <TableHead>Min Area (sqcm)</TableHead>
                <TableHead>Max Area (sqcm)</TableHead>
                <TableHead>Price / sqcm (T1)</TableHead>
                <TableHead>Price / sqcm (T2)</TableHead>
                <TableHead>Threshold (sqcm)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.products?.name_en || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.product_subtypes?.name_en || '-'}
                  </TableCell>
                  <TableCell>{item.min_area_sqcm}</TableCell>
                  <TableCell>{item.max_area_sqcm}</TableCell>
                  <TableCell>${item.price_per_sqcm_tier1}</TableCell>
                  <TableCell>${item.price_per_sqcm_tier2}</TableCell>
                  <TableCell>{item.threshold_sqcm || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
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
