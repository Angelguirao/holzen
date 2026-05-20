function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
}

/** Renders a branded PNG for native share / download (browser canvas API). */
export function generateReflectionShareImage(
  message: string,
  context?: string | null,
  haiku?: string | null,
): Promise<Blob> {
  return new Promise((resolve) => {
    const scale = 2;
    const width = 600;
    const pad = 48;
    const contentWidth = width - pad * 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width * scale;
    tempCanvas.height = 1000 * scale;
    const tmpCtx = tempCanvas.getContext('2d')!;
    tmpCtx.scale(scale, scale);

    let estimatedHeight = pad + 20;

    if (context) {
      tmpCtx.font = '11px "IBM Plex Mono", monospace';
      estimatedHeight += 24;
    }

    tmpCtx.font = '20px "Inter", system-ui, sans-serif';
    const msgWords = message.split(' ');
    let msgLine = '';
    let msgLines = 1;
    for (const word of msgWords) {
      const test = msgLine + (msgLine ? ' ' : '') + word;
      if (tmpCtx.measureText(test).width > contentWidth && msgLine) {
        msgLines++;
        msgLine = word;
      } else {
        msgLine = test;
      }
    }
    estimatedHeight += msgLines * 30 + 24;

    if (haiku) {
      const haikuLines = haiku.split(/\\n|\n/).filter(Boolean);
      estimatedHeight += 24 + haikuLines.length * 22 + 16;
    }

    estimatedHeight += 48 + pad;
    const height = Math.max(320, estimatedHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgb(245 242 236)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgb(42 42 42)';
    ctx.fillRect(0, 0, width, 3);

    let y = pad + 16;

    if (context) {
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgb(154 148 136)';
      ctx.fillText(context.toUpperCase(), pad, y);
      y += 28;
    }

    ctx.font = '20px "Inter", system-ui, sans-serif';
    ctx.fillStyle = 'rgb(42 42 42)';
    y = wrapCanvasText(ctx, message, pad, y, contentWidth, 30);
    y += 32;

    if (haiku) {
      const haikuLines = haiku.split(/\\n|\n/).map((l: string) => l.trim()).filter(Boolean);

      ctx.strokeStyle = 'rgb(216 212 204)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + 120, y);
      ctx.stroke();
      y += 20;

      ctx.font = 'italic 14px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgb(107 101 96)';
      for (const line of haikuLines) {
        ctx.fillText(line, pad, y);
        y += 22;
      }
      y += 8;
    }

    const footerY = height - pad + 4;

    ctx.strokeStyle = 'rgb(216 212 204)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(pad, footerY - 20);
    ctx.lineTo(width - pad, footerY - 20);
    ctx.stroke();

    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgb(154 148 136)';
    ctx.fillText('HOLZEN', pad, footerY);

    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgb(184 180 172)';
    const tagline = 'PAUSE BEFORE YOU ACT';
    const tagWidth = ctx.measureText(tagline).width;
    ctx.fillText(tagline, width - pad - tagWidth, footerY);

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
