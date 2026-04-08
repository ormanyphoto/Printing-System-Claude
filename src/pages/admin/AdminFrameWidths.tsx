import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminFrameWidths() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('frame_widths').select('*').order('width_cm').then(({ data }) => setItems(data || []));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this frame width?')) return;
    await supabase.from('frame_widths').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Frame Widths</h1>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Frame Width</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Width (cm)</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (HE)</TableHead>
                <TableHead>Surcharge (%)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.width_cm} cm</TableCell>
                  <TableCell>{item.name_en || '-'}</TableCell>
                  <TableCell dir="rtl">{item.name_he || '-'}</TableCell>
                  <TableCell>{item.surcharge_pct != null ? `${item.surcharge_pct}%` : '0%'}</TableCell>
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
