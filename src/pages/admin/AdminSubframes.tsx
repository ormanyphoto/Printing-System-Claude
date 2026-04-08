import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminSubframes() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('subframe_options').select('*').order('sort_order').then(({ data }) => setItems(data || []));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subframe option?')) return;
    await supabase.from('subframe_options').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subframe Options</h1>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Subframe</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (HE)</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Depth (cm)</TableHead>
                <TableHead>Surcharge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name_en}</TableCell>
                  <TableCell dir="rtl">{item.name_he}</TableCell>
                  <TableCell>{item.material || '-'}</TableCell>
                  <TableCell>{item.color || '-'}</TableCell>
                  <TableCell>{item.depth_cm != null ? `${item.depth_cm} cm` : '-'}</TableCell>
                  <TableCell>{item.surcharge != null ? `$${item.surcharge}` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.enabled ? 'default' : 'secondary'}>
                      {item.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
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
