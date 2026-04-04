import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProofImageLightboxProps = {
  src: string;
  alt: string;
  /** Optional line shown under the enlarged image */
  caption?: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Landing-page proof screenshot: opens a full-size lightbox on click/tap.
 * Uses a dedicated z-index stack so the modal sits above the fixed nav (z-50).
 */
export function ProofImageLightbox({
  src,
  alt,
  caption,
  className,
  imgClassName,
}: ProofImageLightboxProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'group relative w-full overflow-hidden rounded-lg border-0 bg-transparent p-0 text-left outline-none',
            'transition-transform duration-300 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            className
          )}
          aria-label={`View full size: ${alt}`}
        >
          <img src={src} alt={alt} className={cn('w-full', imgClassName)} />
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-[inherit] bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          >
            <ZoomIn className="h-7 w-7 shrink-0 text-white drop-shadow-md md:h-8 md:w-8" />
            <span className="hidden text-xs font-bold uppercase tracking-wider text-white drop-shadow-md sm:inline">
              View full size
            </span>
          </span>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[100] bg-black/88 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[101] max-h-[92vh] w-[min(96vw,1440px)] max-w-[96vw] -translate-x-1/2 -translate-y-1/2',
            'overflow-hidden rounded-xl border border-border bg-background p-2 shadow-2xl duration-200 sm:p-3',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">{caption ?? alt}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Enlarged product screenshot. Press Escape or use the close control to return to the page.
          </DialogPrimitive.Description>
          <div className="max-h-[calc(92vh-3rem)] overflow-auto">
            <img
              src={src}
              alt={alt}
              className="mx-auto block h-auto w-full max-w-full object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
          {caption ? (
            <p className="mt-2 px-2 pb-1 text-center text-xs text-muted-foreground sm:text-sm">{caption}</p>
          ) : null}
          <DialogPrimitive.Close
            type="button"
            className="absolute right-2 top-2 rounded-md border border-border bg-background/95 p-2 text-foreground shadow-sm ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
