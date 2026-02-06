import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { MockLanguageModel, getLanguageModel } from "@/lib/provider";

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("MockLanguageModel has correct specification", () => {
  const model = new MockLanguageModel("test-model");

  expect(model.specificationVersion).toBe("v3");
  expect(model.provider).toBe("mock");
  expect(model.modelId).toBe("test-model");
  expect(model.supportedUrls).toEqual({});
});

test("getLanguageModel returns MockLanguageModel when no API key", () => {
  const model = getLanguageModel();

  expect(model).toBeInstanceOf(MockLanguageModel);
  expect(model.modelId).toBe("mock-claude-sonnet-4-0");
});

test("getLanguageModel returns MockLanguageModel when API key is empty string", () => {
  vi.stubEnv("ANTHROPIC_API_KEY", "   ");

  const model = getLanguageModel();

  expect(model).toBeInstanceOf(MockLanguageModel);
});

test("MockLanguageModel doGenerate returns valid response structure", async () => {
  const model = new MockLanguageModel("test-model");

  const result = await model.doGenerate({
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: "Create a counter component" }],
      },
    ],
  });

  expect(result).toHaveProperty("content");
  expect(result).toHaveProperty("finishReason");
  expect(result).toHaveProperty("usage");
  expect(result).toHaveProperty("warnings");
  expect(result.usage).toHaveProperty("inputTokens");
  expect(result.usage).toHaveProperty("outputTokens");
  expect(result.finishReason).toHaveProperty("unified");
});

test("MockLanguageModel doStream returns valid stream structure", async () => {
  const model = new MockLanguageModel("test-model");

  const result = await model.doStream({
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: "Create a counter" }],
      },
    ],
  });

  expect(result).toHaveProperty("stream");
  expect(result.stream).toBeInstanceOf(ReadableStream);
});

test("MockLanguageModel generates tool call on first step", async () => {
  const model = new MockLanguageModel("test-model");

  const result = await model.doGenerate({
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: "Create a counter" }],
      },
    ],
  });

  const toolCalls = result.content.filter((c: any) => c.type === "tool-call");
  expect(toolCalls.length).toBeGreaterThan(0);
  expect(toolCalls[0].toolName).toBe("str_replace_editor");
  expect(result.finishReason.unified).toBe("tool-calls");
});

test("MockLanguageModel detects form component from prompt", async () => {
  const model = new MockLanguageModel("test-model");

  const result = await model.doGenerate({
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: "Create a contact form" }],
      },
    ],
  });

  const toolCalls = result.content.filter((c: any) => c.type === "tool-call");
  const toolInput = JSON.parse(toolCalls[0].input);
  expect(toolInput.path).toBe("/App.jsx");
});

test("MockLanguageModel detects card component from prompt", async () => {
  const model = new MockLanguageModel("test-model");

  const result = await model.doGenerate({
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: "Create a card" }],
      },
    ],
  });

  const toolCalls = result.content.filter((c: any) => c.type === "tool-call");
  const toolInput = JSON.parse(toolCalls[0].input);
  expect(toolInput.path).toBe("/App.jsx");
});

test(
  "MockLanguageModel finishes after enough tool calls",
  async () => {
    const model = new MockLanguageModel("test-model");

    const result = await model.doGenerate({
      prompt: [
        {
          role: "user",
          content: [{ type: "text", text: "Create a counter" }],
        },
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "1",
              toolName: "test",
              output: { type: "text", value: "ok" },
            },
          ],
        },
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "2",
              toolName: "test",
              output: { type: "text", value: "ok" },
            },
          ],
        },
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "3",
              toolName: "test",
              output: { type: "text", value: "ok" },
            },
          ],
        },
      ],
    });

    expect(result.finishReason.unified).toBe("stop");
    const toolCalls = result.content.filter((c: any) => c.type === "tool-call");
    expect(toolCalls.length).toBe(0);
  },
  15000
);

test("MockLanguageModel stream emits text parts", async () => {
  const model = new MockLanguageModel("test-model");

  const { stream } = await model.doStream({
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: "Create a counter" }],
      },
    ],
  });

  const reader = stream.getReader();
  const parts: any[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }

  const textDeltas = parts.filter((p) => p.type === "text-delta");
  const toolCalls = parts.filter((p) => p.type === "tool-call");
  const finishParts = parts.filter((p) => p.type === "finish");

  expect(textDeltas.length).toBeGreaterThan(0);
  expect(toolCalls.length).toBe(1);
  expect(finishParts.length).toBe(1);
});
