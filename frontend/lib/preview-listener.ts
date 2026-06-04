import {
  handlePreviewChainUpdate,
  handlePreviewSelectById,
} from "$lib/bridge-selection.svelte";
import { isPreviewMessageSource } from "$lib/preview-messaging";
import type {
  DreamloomPreviewChainUpdateMessage,
  DreamloomPreviewSelectByIdMessage,
} from "$panels/center/preview-bridge";

function onPreviewMessage(event: MessageEvent): void {
  if (!isPreviewMessageSource(event.source)) {
    return;
  }

  const data = event.data as { type?: string } | undefined;
  if (!data?.type) {
    return;
  }

  if (data.type === "dreamloom:selectById") {
    void handlePreviewSelectById(data as DreamloomPreviewSelectByIdMessage);
    return;
  }

  if (data.type === "dreamloom:chainUpdate") {
    void handlePreviewChainUpdate(data as DreamloomPreviewChainUpdateMessage);
  }
}

export function mountPreviewMessageListener(): () => void {
  window.addEventListener("message", onPreviewMessage);
  return () => window.removeEventListener("message", onPreviewMessage);
}
