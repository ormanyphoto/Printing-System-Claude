import { toast } from 'sonner';

export function useToast() {
  return {
    toast: (message: string, options?: { description?: string }) => {
      toast(message, options);
    },
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
  };
}
