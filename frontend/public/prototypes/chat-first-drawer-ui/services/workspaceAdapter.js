import { mockWorkspaceData } from "../data/mockData.js";

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function createMockWorkspaceAdapter() {
  let replyIndex = 0;

  return {
    async getWorkspaceState() {
      await delay(80);
      return structuredClone(mockWorkspaceData);
    },

    async sendMessage(input) {
      await delay(1500);
      const reply =
        mockWorkspaceData.simulatedReplies[
          replyIndex % mockWorkspaceData.simulatedReplies.length
        ];
      replyIndex += 1;

      return {
        id: `reply-${Date.now()}`,
        role: "assistant",
        text: reply.text,
        attachment: reply.attachment ?? null,
        timestamp: new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
        sourceInput: input,
      };
    },
  };
}
