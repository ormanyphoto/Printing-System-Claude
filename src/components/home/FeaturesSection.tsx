import { Card, CardContent } from '@/components/ui/card';
import { Printer, Frame, Palette, Truck } from 'lucide-react';

const features = [
  { icon: Printer, title: 'Premium Printing', description: 'Museum-quality prints on fine art papers' },
  { icon: Frame, title: 'Custom Framing', description: 'Wide selection of frame styles and materials' },
  { icon: Palette, title: 'Multiple Materials', description: 'Canvas, photo paper, acrylic, and more' },
  { icon: Truck, title: 'Global Shipping', description: 'DHL Express worldwide delivery' },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center border-0 shadow-sm">
              <CardContent className="pt-6">
                <feature.icon className="mx-auto h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
