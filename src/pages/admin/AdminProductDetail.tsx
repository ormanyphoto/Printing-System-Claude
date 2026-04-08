import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ThumbnailUpload from '@/components/admin/ThumbnailUpload';
import VariantMappingsManager from '@/components/admin/VariantMappingsManager';

export default function AdminProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    supabase.from('products').select('*').eq('slug', slug).single().then(({ data }) => setProduct(data));
  }, [slug]);

  if (!product) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{product.name_en}</h1>
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Shopify Variants</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Name (EN)</Label><Input defaultValue={product.name_en} /></div>
                <div><Label>Name (HE)</Label><Input defaultValue={product.name_he} dir="rtl" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Max Width (cm)</Label><Input type="number" defaultValue={product.max_width_cm} /></div>
                <div><Label>Max Height (cm)</Label><Input type="number" defaultValue={product.max_height_cm} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked={product.enabled} />
                <Label>Enabled</Label>
              </div>
              <ThumbnailUpload currentUrl={product.thumbnail_url} bucket="admin-thumbnails" path={`products/${product.id}`} onUpload={(url) => console.log('Uploaded:', url)} />
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="variants">
          <VariantMappingsManager productId={product.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
