import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, type ToastType } from '../store/toast.store';
import { cn } from '../lib/utils';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />,
  error: <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />,
  info: <Info className="h-4 w-4 shrink-0 text-blue-400" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />,
};

const bgClasses: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
            'animate-in slide-in-from-right-5 fade-in-0 duration-200',
            bgClasses[t.type],
          )}
        >
          {icons[t.type]}
          <p className="flex-1 text-sm text-foreground">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
