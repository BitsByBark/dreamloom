import type {
  DreamloomPreviewHighlightDlMessage,
  DreamloomPreviewPickMessage,
} from "$panels/center/preview-bridge";

export type PreviewOutboundMessage = DreamloomPreviewPickMessage | DreamloomPreviewHighlightDlMessage;

export function getPreviewFrame(): HTMLIFrameElement | null {
  return document.querySelector("iframe.preview-frame");
}

export function postToPreview(message: PreviewOutboundMessage): void {
  const win = getPreviewFrame()?.contentWindow;
  if (!win) {
    return;
  }

  win.postMessage(message, "*");
}

export function isPreviewMessageSource(source: MessageEventSource | null): boolean {
  const frame = getPreviewFrame();
  return frame?.contentWindow != null && source === frame.contentWindow;
}
