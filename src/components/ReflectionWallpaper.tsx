import { useState, useCallback } from 'react';
import { Sparkles, Download, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  message: string;
  mood?: string | null;
  context?: string | null;
}

export function ReflectionWallpaper({ message, mood, context }: Props) {
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const generate = useCallback(async () => {
    setGenerating(true);
    setOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-wallpaper', {
        body: { message, mood, context },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setImageUrl(data.image);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate wallpaper');
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  }, [message, mood, context]);

  const download = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'holzen-wallpaper.png';
    a.click();
    toast('Wallpaper downloaded');
  }, [imageUrl]);

  return (
    <>
      <button
        onClick={generate}
        disabled={generating}
        className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-50"
        title="Generate wallpaper from this reflection"
      >
        {generating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        Wallpaper
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-card border-border">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm font-mono tracking-wider">
              Reflection Wallpaper
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-mono">
                  Generating your wallpaper…
                </p>
              </div>
            ) : imageUrl ? (
              <>
                <div className="relative rounded-lg overflow-hidden border border-border/60 aspect-[9/16] bg-muted/30">
                  <img
                    src={imageUrl}
                    alt="Reflection wallpaper"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={download}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-mono transition-colors hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setImageUrl(null);
                      generate();
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Regenerate
                  </button>
                </div>
              </>
            ) : null}

            <p className="text-[10px] text-muted-foreground/60 font-mono text-center">
              Carry your composure with you
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
