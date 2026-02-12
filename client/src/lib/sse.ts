import { getAccessToken } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface SSECallbacks {
  onChunk: (content: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamChat(
  conversationId: number,
  content: string,
  callbacks: SSECallbacks
): Promise<void> {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE}/api/chat/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!res.ok || !res.body) {
    callbacks.onError("Erreur de connexion");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last potentially incomplete line
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6);

      try {
        const event = JSON.parse(jsonStr);
        if (event.type === "chunk") {
          callbacks.onChunk(event.content);
        } else if (event.type === "done") {
          callbacks.onDone();
          return;
        } else if (event.type === "error") {
          callbacks.onError(event.error);
          return;
        }
      } catch {
        // Ignore malformed JSON
      }
    }
  }

  // If stream ended without explicit done event
  callbacks.onDone();
}
