const PREVIEW_SETTLE_MS = 700;
const BLOCKING_PRINT_MS = 50;
const LISTENER_TIMEOUT_MS = 5 * 60 * 1000;

export function printDocument(
  onConfirmedPrint: () => void,
  onSettled?: () => void
) {
  let previewReady = false;
  let settled = false;
  const startedAt = performance.now();
  const mediaQuery = window.matchMedia("print");
  const previousAfterPrint = window.onafterprint;
  let previewReadyId = 0;
  let timeoutId = 0;

  const cleanup = () => {
    window.clearTimeout(previewReadyId);
    window.clearTimeout(timeoutId);

    window.removeEventListener("beforeprint", handleBeforePrint);
    window.removeEventListener("afterprint", handleAfterPrint);
    mediaQuery.removeEventListener("change", handleMediaChange);

    if (window.onafterprint === handleAfterPrint) {
      window.onafterprint = previousAfterPrint;
    }
  };

  const settle = (confirmed: boolean) => {
    if (settled) {
      return;
    }

    settled = true;

    if (confirmed) {
      onConfirmedPrint();
    }

    const complete = () => {
      cleanup();
      onSettled?.();
    };

    if (confirmed && onSettled) {
      let completed = false;
      const finishAfterCapture = () => {
        if (completed) {
          return;
        }

        completed = true;
        window.removeEventListener("afterprint", finishAfterCapture);
        window.clearTimeout(captureTimeoutId);
        complete();
      };
      const captureTimeoutId = window.setTimeout(finishAfterCapture, 2000);

      window.removeEventListener("beforeprint", handleBeforePrint);
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.clearTimeout(previewReadyId);
      window.clearTimeout(timeoutId);
      window.addEventListener("afterprint", finishAfterCapture);
      return;
    }

    complete();
  };

  const markPreviewReady = () => {
    if (settled || previewReady) {
      return;
    }

    previewReady = true;
  };

  const handleBeforePrint = () => {
    if (previewReady) {
      settle(true);
    }
  };

  const handleMediaChange = (event: MediaQueryListEvent) => {
    if (event.matches && previewReady) {
      settle(true);
    }
  };

  const handleAfterPrint = () => {
    if (!previewReady && performance.now() - startedAt < PREVIEW_SETTLE_MS) {
      markPreviewReady();
      return;
    }

    settle(false);
  };

  window.addEventListener("beforeprint", handleBeforePrint);
  window.addEventListener("afterprint", handleAfterPrint);
  mediaQuery.addEventListener("change", handleMediaChange);
  window.onafterprint = handleAfterPrint;
  previewReadyId = window.setTimeout(markPreviewReady, PREVIEW_SETTLE_MS);
  timeoutId = window.setTimeout(() => settle(false), LISTENER_TIMEOUT_MS);

  try {
    window.print();
  } catch {
    settle(false);
    return;
  }

  // Firefox-style blocking print(): the dialog is already gone when this runs.
  // Chrome returns immediately and keeps the preview open for afterprint.
  if (!settled && performance.now() - startedAt > BLOCKING_PRINT_MS) {
    settle(false);
  }
}
