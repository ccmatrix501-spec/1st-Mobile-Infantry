import type { Server as HttpServer, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type WebSocket } from "ws";
import { getBugsKilledAt } from "../lib/bugs-killed";
import {
  BUGS_KILLED_WS_PATH,
  type BugsKilledWsClientMessage,
  type BugsKilledWsMessage,
} from "../lib/bugs-killed-protocol";

/**
 * Attach a dedicated WebSocket feed for the shared bugs-killed tally.
 * Broadcasts server-clock ticks so every connected client shows the same value.
 */
export function attachBugsKilledWs(httpServer: HttpServer): () => void {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<WebSocket>();

  function send(ws: WebSocket, msg: BugsKilledWsMessage) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function broadcastTick() {
    const serverTime = Date.now();
    const count = getBugsKilledAt(serverTime);
    const msg: BugsKilledWsMessage = { type: "tick", count, serverTime };
    const raw = JSON.stringify(msg);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) ws.send(raw);
    }
  }

  const onUpgrade = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
    if (pathOnly !== BUGS_KILLED_WS_PATH) {
      // Leave Vite HMR / other upgrades alone.
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  };

  httpServer.on("upgrade", onUpgrade);

  wss.on("connection", (ws) => {
    clients.add(ws);
    const serverTime = Date.now();
    send(ws, {
      type: "hello",
      count: getBugsKilledAt(serverTime),
      serverTime,
    });

    ws.on("message", (data) => {
      try {
        const parsed = JSON.parse(String(data)) as BugsKilledWsClientMessage;
        if (parsed?.type === "ping") {
          send(ws, { type: "pong", serverTime: Date.now() });
        } else if (parsed?.type === "subscribe") {
          const t = Date.now();
          send(ws, { type: "hello", count: getBugsKilledAt(t), serverTime: t });
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
    ws.on("error", () => {
      clients.delete(ws);
    });
  });

  // ~8 Hz is enough for a slow counter
  const interval = setInterval(broadcastTick, 120);

  return () => {
    clearInterval(interval);
    httpServer.off("upgrade", onUpgrade);
    for (const ws of clients) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
    clients.clear();
    wss.close();
  };
}
