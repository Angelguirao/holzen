import { useCallback } from 'react';
import { Share2, Copy, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Props {
  message: string;
  context?: string | null;
}

function generateShareImage(message: string, context?: string | null): Promise<Blob> {
  return new Promise((resolve) => {
    const scale = 2;
    const width = 600;
    const height = 400;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#f5f2ec';
    ctx.fillRect(0, 0, width, height);

    // Border accent
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 3, height);

    // Context
    let yOffset = 60;
    if (context) {
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#8a8578';
      ctx.fillText(context, 40, yOffset);
      yOffset += 30;
    }

    // Message - word wrap
    ctx.font = '18px "Inter", system-ui, sans-serif';
    ctx.fillStyle = '#2a2a2a';
    const maxWidth = width - 80;
    const lineHeight = 28;
    const words = message.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, 40, yOffset);
        line = word;
        yOffset += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 40, yOffset);

    // Footer
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#8a8578';
    ctx.fillText('HOLZEN — PAUSE BEFORE YOU ACT', 40, height - 40);

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export function ShareReflection({ message, context }: Props) {
  const { toast } = useToast();

  const copyText = useCallback(async () => {
    const text = context
      ? `${context}\n\n${message}\n\n— Holzen`
      : `${message}\n\n— Holzen`;
    await navigator.clipboard.writeText(text);
    toast({ description: 'Copied to clipboard' });
  }, [message, context, toast]);

  const shareImage = useCallback(async () => {
    try {
      const blob = await generateShareImage(message, context);
      const file = new File([blob], 'holzen-reflection.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Holzen Reflection',
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'holzen-reflection.png';
        a.click();
        URL.revokeObjectURL(url);
        toast({ description: 'Image downloaded' });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast({ description: 'Could not share image', variant: 'destructive' });
      }
    }
  }, [message, context, toast]);

  const shareText = useCallback(async () => {
    const text = context
      ? `${context}\n\n${message}\n\n— Holzen`
      : `${message}\n\n— Holzen`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e: any) {
        if (e.name !== 'AbortError') await copyText();
      }
    } else {
      await copyText();
    }
  }, [message, context, copyText]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-mono text-muted-foreground gap-1.5"
        >
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={copyText} className="text-xs gap-2">
          <Copy className="h-3 w-3" />
          Copy text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareText} className="text-xs gap-2">
          <Share2 className="h-3 w-3" />
          Share text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareImage} className="text-xs gap-2">
          <Image className="h-3 w-3" />
          Share as image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
