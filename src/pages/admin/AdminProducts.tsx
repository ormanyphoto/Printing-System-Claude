import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('products').select('*').order('sort_order').then(({ data }) => setProducts(data || []));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button><Plus className="mr-1 h-4 w-4" /> Add Product</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Max Size</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name_en}</TableCell>
                  <TableCell className="text-muted-foreground">{p.slug}</TableCell>
                  <TableCell><Badge variant={p.enabled ? 'default' : 'secondary'}>{p.enabled ? 'Active' : 'Disabled'}</Badge></TableCell>
                  <TableCell>{p.max_width_cm}x{p.max_height_cm}cm</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/product/${p.slug}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
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
