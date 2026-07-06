import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui';

export default function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
  variant = 'destructive',
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    cancelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !loading) {
        onOpenChange(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onOpenChange]);

  if (!open) return null;

  async function handleConfirm() {
    await onConfirm?.();
  }

  return createPortal(
    <div className="dialog-overlay animate-fade-in" role="presentation">
      <button
        type="button"
        className="dialog-overlay-backdrop"
        aria-label={cancelLabel}
        disabled={loading}
        onClick={() => onOpenChange(false)}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="dialog-content animate-scale-in"
      >
        <div className="flex gap-4">
          {variant === 'destructive' && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600"
              aria-hidden="true"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <h2 id={titleId} className="text-lg font-semibold leading-none text-slate-900">
              {title}
            </h2>
            <p id={descriptionId} className="text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <div className="dialog-footer">
          <Button
            ref={cancelRef}
            variant="secondary"
            size="md"
            disabled={loading}
            className="dialog-footer-btn"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            size="md"
            disabled={loading}
            className="dialog-footer-btn"
            onClick={handleConfirm}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
