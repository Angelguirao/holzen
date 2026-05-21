const REFLECTION_SHARE_FILENAME = 'holzen-reflection.png';
const REFLECTION_SHARE_TITLE = 'Holzen Reflection';

export type DeliverReflectionShareImageOutcome = 'shared' | 'downloaded' | 'aborted';

export type DeliverReflectionShareImageDeps = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
  createDownloadAnchor?: () => HTMLAnchorElement;
};

/** Native share when available; otherwise trigger a file download. */
export async function deliverReflectionShareImage(
  blob: Blob,
  deps: DeliverReflectionShareImageDeps = {},
): Promise<DeliverReflectionShareImageOutcome> {
  const file = new File([blob], REFLECTION_SHARE_FILENAME, {
    type: blob.type || 'image/png',
  });
  const share = deps.share ?? navigator.share?.bind(navigator);
  const canShare = deps.canShare ?? navigator.canShare?.bind(navigator);

  if (share && canShare?.({ files: [file] })) {
    try {
      await share({ files: [file], title: REFLECTION_SHARE_TITLE });
      return 'shared';
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return 'aborted';
      }
      throw e;
    }
  }

  const createObjectURL = deps.createObjectURL ?? URL.createObjectURL.bind(URL);
  const revokeObjectURL = deps.revokeObjectURL ?? URL.revokeObjectURL.bind(URL);
  const createDownloadAnchor =
    deps.createDownloadAnchor ?? (() => document.createElement('a'));

  const url = createObjectURL(blob);
  const anchor = createDownloadAnchor();
  anchor.href = url;
  anchor.download = REFLECTION_SHARE_FILENAME;
  anchor.click();
  revokeObjectURL(url);
  return 'downloaded';
}
