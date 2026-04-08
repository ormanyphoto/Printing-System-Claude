import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminTooltips() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('material_tooltips')
      .select('*')
      .order('product_slug')
      .then(({ data }) => setItems(data || []));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tooltip?')) return;
    await supabase.from('material_tooltips').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Material Tooltips</h1>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Tooltip</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Slug</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Title (HE)</TableHead>
                <TableHead>Finish (EN)</TableHead>
                <TableHead>Best For (EN)</TableHead>
                <TableHead>Durability (EN)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.product_slug}</TableCell>
                  <TableCell className="font-medium">{item.title_en}</TableCell>
                  <TableCell dir="rtl">{item.title_he}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{item.finish_en || '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{item.best_for_en || '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{item.durability_en || '-'}</TableCell>
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
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No tooltips configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
