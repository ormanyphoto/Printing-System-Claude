import { useState, useCallback } from 'react';

export interface OrderState {
  step: number;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  productId: string | null;
  subtypeId: string | null;
  sizeId: string | null;
  finishId: string | null;
  frameStyleId: string | null;
  frameColorId: string | null;
  frameWidthId: string | null;
  glazingId: string | null;
  subframeId: string | null;
  addFrame: boolean;
  whiteBorder: boolean;
  canvasEdgeWrap: string;
  totalPrice: number;
}

const initialState: OrderState = {
  step: 1,
  imageFile: null,
  imagePreviewUrl: null,
  productId: null,
  subtypeId: null,
  sizeId: null,
  finishId: null,
  frameStyleId: null,
  frameColorId: null,
  frameWidthId: null,
  glazingId: null,
  subframeId: null,
  addFrame: false,
  whiteBorder: false,
  canvasEdgeWrap: 'mirror',
  totalPrice: 0,
};

export function useOrderFlow() {
  const [state, setState] = useState<OrderState>(initialState);

  const updateState = useCallback((updates: Partial<OrderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, 5) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const setImage = useCallback((file: File, previewUrl: string) => {
    setState(prev => ({ ...prev, imageFile: file, imagePreviewUrl: previewUrl }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    updateState,
    nextStep,
    prevStep,
    goToStep,
    setImage,
    reset,
  };
}
