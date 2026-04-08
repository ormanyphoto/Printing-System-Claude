import { useTranslation } from 'react-i18next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StepProgress from '@/components/order/StepProgress';
import ImageUpload from '@/components/order/ImageUpload';
import ProductSelector from '@/components/order/ProductSelector';
import SizeSelector from '@/components/order/SizeSelector';
import OrderSummary from '@/components/order/OrderSummary';
import ProductPreview from '@/components/order/ProductPreview';
import { Button } from '@/components/ui/button';
import { useOrderFlow } from '@/hooks/useOrderFlow';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Order() {
  const { t } = useTranslation();
  const { state, updateState, nextStep, prevStep, setImage } = useOrderFlow();
  const [products, setProducts] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('products').select('*').eq('enabled', true).order('sort_order').then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    if (state.productId) {
      supabase.from('size_presets').select('*').eq('product_id', state.productId).eq('enabled', true).order('sort_order').then(({ data }) => setSizes(data || []));
    }
  }, [state.productId]);

  const selectedProduct = products.find(p => p.id === state.productId);
  const selectedSize = sizes.find(s => s.id === state.sizeId);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t('order.title')}</h1>
        <StepProgress currentStep={state.step} totalSteps={5} />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {state.step === 1 && (
              <ImageUpload
                onImageSelect={(file, url) => { setImage(file, url); nextStep(); }}
                currentImage={state.imagePreviewUrl}
              />
            )}
            {state.step === 2 && (
              <ProductSelector
                products={products}
                selectedId={state.productId}
                onSelect={(p) => { updateState({ productId: p.id }); nextStep(); }}
              />
            )}
            {state.step === 3 && (
              <SizeSelector
                sizes={sizes}
                selectedId={state.sizeId}
                onSelect={(s) => { updateState({ sizeId: s.id }); nextStep(); }}
              />
            )}
            {state.step === 4 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Customization options will appear here based on product type.</p>
                <Button onClick={nextStep}>{t('order.continue')}</Button>
              </div>
            )}
            {state.step === 5 && (
              <OrderSummary
                imagePreview={state.imagePreviewUrl}
                productName={selectedProduct?.name_en || ''}
                sizeName={selectedSize ? `${selectedSize.width_cm}x${selectedSize.height_cm}cm` : ''}
                finishName="Standard"
                total={state.totalPrice}
                onSubmit={() => alert('Order submitted!')}
              />
            )}
          </div>

          <div className="space-y-4">
            {state.imagePreviewUrl && (
              <ProductPreview
                imageUrl={state.imagePreviewUrl}
                widthCm={selectedSize?.width_cm || 40}
                heightCm={selectedSize?.height_cm || 30}
                hasFrame={state.addFrame}
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          {state.step > 1 && (
            <Button variant="outline" onClick={prevStep}>{t('order.back')}</Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
