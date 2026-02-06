import { test, expect, beforeEach } from "vitest";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { VirtualFileSystem } from "@/lib/file-system";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildFileManagerTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildFileManagerTool(fs);
});

// rename command tests
test("rename command renames a file", async () => {
  fs.createFile("/old.txt", "content");

  const result = await tool.execute({
    command: "rename",
    path: "/old.txt",
    new_path: "/new.txt",
  });

  expect(result.success).toBe(true);
  expect(result.message).toBe("Successfully renamed /old.txt to /new.txt");
  expect(fs.exists("/old.txt")).toBe(false);
  expect(fs.exists("/new.txt")).toBe(true);
  expect(fs.readFile("/new.txt")).toBe("content");
});

test("rename command moves a file to different directory", async () => {
  fs.createFile("/file.txt", "content");
  fs.createDirectory("/folder");

  const result = await tool.execute({
    command: "rename",
    path: "/file.txt",
    new_path: "/folder/file.txt",
  });

  expect(result.success).toBe(true);
  expect(fs.exists("/file.txt")).toBe(false);
  expect(fs.exists("/folder/file.txt")).toBe(true);
});

test("rename command creates parent directories", async () => {
  fs.createFile("/file.txt", "content");

  const result = await tool.execute({
    command: "rename",
    path: "/file.txt",
    new_path: "/deeply/nested/path/file.txt",
  });

  expect(result.success).toBe(true);
  expect(fs.exists("/deeply")).toBe(true);
  expect(fs.exists("/deeply/nested")).toBe(true);
  expect(fs.exists("/deeply/nested/path")).toBe(true);
  expect(fs.exists("/deeply/nested/path/file.txt")).toBe(true);
});

test("rename command renames a directory", async () => {
  fs.createDirectory("/old-dir");
  fs.createFile("/old-dir/file.txt", "content");

  const result = await tool.execute({
    command: "rename",
    path: "/old-dir",
    new_path: "/new-dir",
  });

  expect(result.success).toBe(true);
  expect(fs.exists("/old-dir")).toBe(false);
  expect(fs.exists("/new-dir")).toBe(true);
  expect(fs.exists("/new-dir/file.txt")).toBe(true);
  expect(fs.readFile("/new-dir/file.txt")).toBe("content");
});

test("rename command returns error when new_path not provided", async () => {
  fs.createFile("/file.txt", "content");

  const result = await tool.execute({
    command: "rename",
    path: "/file.txt",
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe("new_path is required for rename command");
});

test("rename command returns error for non-existent source", async () => {
  const result = await tool.execute({
    command: "rename",
    path: "/nonexistent.txt",
    new_path: "/new.txt",
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe("Failed to rename /nonexistent.txt to /new.txt");
});

test("rename command returns error when destination exists", async () => {
  fs.createFile("/source.txt", "source");
  fs.createFile("/dest.txt", "dest");

  const result = await tool.execute({
    command: "rename",
    path: "/source.txt",
    new_path: "/dest.txt",
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe("Failed to rename /source.txt to /dest.txt");
  expect(fs.readFile("/source.txt")).toBe("source");
  expect(fs.readFile("/dest.txt")).toBe("dest");
});

// delete command tests
test("delete command deletes a file", async () => {
  fs.createFile("/file.txt", "content");

  const result = await tool.execute({
    command: "delete",
    path: "/file.txt",
  });

  expect(result.success).toBe(true);
  expect(result.message).toBe("Successfully deleted /file.txt");
  expect(fs.exists("/file.txt")).toBe(false);
});

test("delete command deletes a directory recursively", async () => {
  fs.createDirectory("/folder");
  fs.createFile("/folder/file1.txt", "content1");
  fs.createDirectory("/folder/subfolder");
  fs.createFile("/folder/subfolder/file2.txt", "content2");

  const result = await tool.execute({
    command: "delete",
    path: "/folder",
  });

  expect(result.success).toBe(true);
  expect(result.message).toBe("Successfully deleted /folder");
  expect(fs.exists("/folder")).toBe(false);
  expect(fs.exists("/folder/file1.txt")).toBe(false);
  expect(fs.exists("/folder/subfolder")).toBe(false);
});

test("delete command returns error for non-existent path", async () => {
  const result = await tool.execute({
    command: "delete",
    path: "/nonexistent.txt",
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe("Failed to delete /nonexistent.txt");
});

test("delete command returns error when deleting root", async () => {
  const result = await tool.execute({
    command: "delete",
    path: "/",
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe("Failed to delete /");
});

// invalid command test
test("invalid command returns error", async () => {
  const result = await tool.execute({
    command: "invalid" as any,
    path: "/file.txt",
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe("Invalid command");
});
