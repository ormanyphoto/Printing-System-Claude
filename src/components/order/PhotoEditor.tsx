import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCw, FlipHorizontal, Crop } from 'lucide-react';

interface PhotoEditorProps {
  imageUrl: string;
  onSave: (editedUrl: string) => void;
  onCancel: () => void;
}

export default function PhotoEditor({ imageUrl, onSave, onCancel }: PhotoEditorProps) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);

  const handleSave = () => {
    // In a full implementation, this would apply transformations to a canvas
    onSave(imageUrl);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crop className="h-5 w-5" /> Edit Photo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center bg-muted rounded-lg p-4">
          <img
            src={imageUrl}
            alt="Edit"
            className="max-h-64 object-contain transition-transform"
            style={{
              transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
            }}
          />
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => setRotation(r => r + 90)}>
            <RotateCw className="mr-1 h-4 w-4" /> Rotate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFlipH(f => !f)}>
            <FlipHorizontal className="mr-1 h-4 w-4" /> Flip
          </Button>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Apply</Button>
        </div>
      </CardContent>
    </Card>
  );
}
