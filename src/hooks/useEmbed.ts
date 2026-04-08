import { useState, useEffect } from 'react';

export function useEmbed() {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [parentOrigin, setParentOrigin] = useState<string | null>(null);

  useEffect(() => {
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    if (embedded) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'lovable:setLanguage') {
          setParentOrigin(event.origin);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const sendCheckout = (variantId: string, quantity: number = 1) => {
    if (isEmbedded && window.parent) {
      window.parent.postMessage(
        { type: 'lovable:checkout', variantId, quantity },
        '*'
      );
    }
  };

  return { isEmbedded, parentOrigin, sendCheckout };
}
