import { useEffect, useRef, useState } from "react";

export const WS_BASE_URL = "ws://localhost:8000";
export const FRAME_TIMEOUT_MS = 10_000;

export const STATUS = {
  CONNECTING: "connecting",
  STREAMING: "streaming",
  DONE: "done",
  TIMEOUT: "timeout",
  ERROR: "error",
};

export const STATUS_CHIP = {
  [STATUS.CONNECTING]: { label: "Connecting…", color: "default" },
  [STATUS.STREAMING]: { label: "Live", color: "success" },
  [STATUS.DONE]: { label: "Done", color: "default" },
  [STATUS.TIMEOUT]: { label: "Timed out", color: "warning" },
  [STATUS.ERROR]: { label: "Error", color: "error" },
};

/**
 * Opens a WebSocket to /ws/live/<taskId> and streams frames.
 *
 * @param {string} taskId
 * @returns {{ status: string, frame: string|null }}
 */
export function useTaskStream(taskId) {
  const [status, setStatus] = useState(STATUS.CONNECTING);
  const [frame, setFrame] = useState(null);
  const timeoutRef = useRef(null);

  function resetFrameTimeout(onTimeout) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(onTimeout, FRAME_TIMEOUT_MS);
  }

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/live/${taskId}`);

    ws.onopen = () => {
      setStatus(STATUS.CONNECTING);
      resetFrameTimeout(() => setStatus(STATUS.TIMEOUT));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.done) {
        clearTimeout(timeoutRef.current);
        setStatus(STATUS.DONE);
        ws.close();
        return;
      }

      if (data.frame) {
        setFrame(`data:image/jpeg;base64,${data.frame}`);
        setStatus(STATUS.STREAMING);
        resetFrameTimeout(() => setStatus(STATUS.TIMEOUT));
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutRef.current);
      setStatus(STATUS.ERROR);
    };

    ws.onclose = () => {
      clearTimeout(timeoutRef.current);
      setStatus((prev) => (prev === STATUS.STREAMING ? STATUS.DONE : prev));
    };

    return () => {
      clearTimeout(timeoutRef.current);
      ws.close();
    };
  }, [taskId]);

  return { status, frame };
}
