import { test, expect, beforeEach } from "vitest";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { VirtualFileSystem } from "@/lib/file-system";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildStrReplaceTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildStrReplaceTool(fs);
});

test("tool has correct id and inputSchema", () => {
  expect(tool.id).toBe("str_replace_editor");
  expect(tool.inputSchema).toBeDefined();
});

// view command tests
test("view command shows file content with line numbers", async () => {
  fs.createFile("/test.txt", "line1\nline2\nline3");

  const result = await tool.execute({
    command: "view",
    path: "/test.txt",
  });

  expect(result).toBe("1\tline1\n2\tline2\n3\tline3");
});

test("view command with view_range shows partial content", async () => {
  fs.createFile("/test.txt", "line1\nline2\nline3\nline4\nline5");

  const result = await tool.execute({
    command: "view",
    path: "/test.txt",
    view_range: [2, 4],
  });

  expect(result).toBe("2\tline2\n3\tline3\n4\tline4");
});

test("view command shows directory contents", async () => {
  fs.createDirectory("/src");
  fs.createFile("/src/index.ts", "");
  fs.createDirectory("/src/components");

  const result = await tool.execute({
    command: "view",
    path: "/src",
  });

  expect(result).toBe("[DIR] components\n[FILE] index.ts");
});

test("view command returns error for non-existent path", async () => {
  const result = await tool.execute({
    command: "view",
    path: "/nonexistent.txt",
  });

  expect(result).toBe("File not found: /nonexistent.txt");
});

// create command tests
test("create command creates new file", async () => {
  const result = await tool.execute({
    command: "create",
    path: "/new-file.txt",
    file_text: "Hello World",
  });

  expect(result).toBe("File created: /new-file.txt");
  expect(fs.readFile("/new-file.txt")).toBe("Hello World");
});

test("create command creates file with parent directories", async () => {
  const result = await tool.execute({
    command: "create",
    path: "/src/components/Button.tsx",
    file_text: "export const Button = () => {};",
  });

  expect(result).toBe("File created: /src/components/Button.tsx");
  expect(fs.exists("/src")).toBe(true);
  expect(fs.exists("/src/components")).toBe(true);
  expect(fs.readFile("/src/components/Button.tsx")).toBe(
    "export const Button = () => {};"
  );
});

test("create command with empty file_text creates empty file", async () => {
  const result = await tool.execute({
    command: "create",
    path: "/empty.txt",
  });

  expect(result).toBe("File created: /empty.txt");
  expect(fs.readFile("/empty.txt")).toBe("");
});

test("create command returns error for existing file", async () => {
  fs.createFile("/existing.txt", "content");

  const result = await tool.execute({
    command: "create",
    path: "/existing.txt",
    file_text: "new content",
  });

  expect(result).toBe("Error: File already exists: /existing.txt");
  expect(fs.readFile("/existing.txt")).toBe("content");
});

// str_replace command tests
test("str_replace command replaces text in file", async () => {
  fs.createFile("/test.txt", "Hello World");

  const result = await tool.execute({
    command: "str_replace",
    path: "/test.txt",
    old_str: "World",
    new_str: "Universe",
  });

  expect(result).toBe("Replaced 1 occurrence(s) of the string in /test.txt");
  expect(fs.readFile("/test.txt")).toBe("Hello Universe");
});

test("str_replace command replaces all occurrences", async () => {
  fs.createFile("/test.txt", "foo bar foo baz foo");

  const result = await tool.execute({
    command: "str_replace",
    path: "/test.txt",
    old_str: "foo",
    new_str: "qux",
  });

  expect(result).toBe("Replaced 3 occurrence(s) of the string in /test.txt");
  expect(fs.readFile("/test.txt")).toBe("qux bar qux baz qux");
});

test("str_replace command handles empty new_str", async () => {
  fs.createFile("/test.txt", "Hello World");

  const result = await tool.execute({
    command: "str_replace",
    path: "/test.txt",
    old_str: " World",
    new_str: "",
  });

  expect(result).toBe("Replaced 1 occurrence(s) of the string in /test.txt");
  expect(fs.readFile("/test.txt")).toBe("Hello");
});

test("str_replace command returns error when string not found", async () => {
  fs.createFile("/test.txt", "Hello World");

  const result = await tool.execute({
    command: "str_replace",
    path: "/test.txt",
    old_str: "nonexistent",
    new_str: "replacement",
  });

  expect(result).toBe('Error: String not found in file: "nonexistent"');
});

test("str_replace command returns error for non-existent file", async () => {
  const result = await tool.execute({
    command: "str_replace",
    path: "/nonexistent.txt",
    old_str: "old",
    new_str: "new",
  });

  expect(result).toBe("Error: File not found: /nonexistent.txt");
});

test("str_replace command returns error for directory", async () => {
  fs.createDirectory("/src");

  const result = await tool.execute({
    command: "str_replace",
    path: "/src",
    old_str: "old",
    new_str: "new",
  });

  expect(result).toBe("Error: Cannot edit a directory: /src");
});

// insert command tests
test("insert command inserts text at specified line", async () => {
  fs.createFile("/test.txt", "line1\nline2\nline3");

  const result = await tool.execute({
    command: "insert",
    path: "/test.txt",
    insert_line: 1,
    new_str: "inserted",
  });

  expect(result).toBe("Text inserted at line 1 in /test.txt");
  expect(fs.readFile("/test.txt")).toBe("line1\ninserted\nline2\nline3");
});

test("insert command inserts at beginning with line 0", async () => {
  fs.createFile("/test.txt", "line1\nline2");

  const result = await tool.execute({
    command: "insert",
    path: "/test.txt",
    insert_line: 0,
    new_str: "first",
  });

  expect(result).toBe("Text inserted at line 0 in /test.txt");
  expect(fs.readFile("/test.txt")).toBe("first\nline1\nline2");
});

test("insert command defaults to line 0 when insert_line not provided", async () => {
  fs.createFile("/test.txt", "existing");

  const result = await tool.execute({
    command: "insert",
    path: "/test.txt",
    new_str: "prepended",
  });

  expect(result).toBe("Text inserted at line 0 in /test.txt");
  expect(fs.readFile("/test.txt")).toBe("prepended\nexisting");
});

test("insert command returns error for non-existent file", async () => {
  const result = await tool.execute({
    command: "insert",
    path: "/nonexistent.txt",
    insert_line: 0,
    new_str: "text",
  });

  expect(result).toBe("Error: File not found: /nonexistent.txt");
});

// undo_edit command tests
test("undo_edit command returns not supported error", async () => {
  const result = await tool.execute({
    command: "undo_edit",
    path: "/test.txt",
  });

  expect(result).toBe(
    "Error: undo_edit command is not supported in this version. Use str_replace to revert changes."
  );
});
