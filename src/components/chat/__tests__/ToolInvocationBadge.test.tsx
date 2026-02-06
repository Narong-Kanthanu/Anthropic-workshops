import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ToolInvocationBadge,
  getToolDisplayMessage,
} from "../ToolInvocationBadge";

describe("getToolDisplayMessage", () => {
  describe("str_replace_editor", () => {
    test("returns 'Creating {path}' for create command", () => {
      const result = getToolDisplayMessage("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      });
      expect(result).toBe("Creating /App.jsx");
    });

    test("returns 'Editing {path}' for str_replace command", () => {
      const result = getToolDisplayMessage("str_replace_editor", {
        command: "str_replace",
        path: "/components/Card.jsx",
      });
      expect(result).toBe("Editing /components/Card.jsx");
    });

    test("returns 'Editing {path}' for insert command", () => {
      const result = getToolDisplayMessage("str_replace_editor", {
        command: "insert",
        path: "/App.jsx",
      });
      expect(result).toBe("Editing /App.jsx");
    });

    test("returns 'Viewing {path}' for view command", () => {
      const result = getToolDisplayMessage("str_replace_editor", {
        command: "view",
        path: "/App.jsx",
      });
      expect(result).toBe("Viewing /App.jsx");
    });

    test("returns tool name for unknown command", () => {
      const result = getToolDisplayMessage("str_replace_editor", {
        command: "unknown",
        path: "/App.jsx",
      });
      expect(result).toBe("str_replace_editor");
    });

    test("returns tool name when path is missing", () => {
      const result = getToolDisplayMessage("str_replace_editor", {
        command: "create",
      });
      expect(result).toBe("str_replace_editor");
    });
  });

  describe("file_manager", () => {
    test("returns 'Renaming {old} → {new}' for rename command", () => {
      const result = getToolDisplayMessage("file_manager", {
        command: "rename",
        path: "/old.jsx",
        new_path: "/new.jsx",
      });
      expect(result).toBe("Renaming /old.jsx → /new.jsx");
    });

    test("returns 'Renaming {path}' when new_path is missing", () => {
      const result = getToolDisplayMessage("file_manager", {
        command: "rename",
        path: "/old.jsx",
      });
      expect(result).toBe("Renaming /old.jsx");
    });

    test("returns 'Deleting {path}' for delete command", () => {
      const result = getToolDisplayMessage("file_manager", {
        command: "delete",
        path: "/unwanted.jsx",
      });
      expect(result).toBe("Deleting /unwanted.jsx");
    });

    test("returns tool name for unknown command", () => {
      const result = getToolDisplayMessage("file_manager", {
        command: "unknown",
        path: "/file.jsx",
      });
      expect(result).toBe("file_manager");
    });

    test("returns tool name when path is missing", () => {
      const result = getToolDisplayMessage("file_manager", {
        command: "delete",
      });
      expect(result).toBe("file_manager");
    });
  });

  describe("fallback behavior", () => {
    test("returns tool name for unknown tool", () => {
      const result = getToolDisplayMessage("unknown_tool", {
        command: "do_something",
        path: "/file.jsx",
      });
      expect(result).toBe("unknown_tool");
    });

    test("returns tool name when args is undefined", () => {
      const result = getToolDisplayMessage("str_replace_editor", undefined);
      expect(result).toBe("str_replace_editor");
    });

    test("returns tool name when args is empty object", () => {
      const result = getToolDisplayMessage("str_replace_editor", {});
      expect(result).toBe("str_replace_editor");
    });
  });

  describe("JSON string args", () => {
    test("parses JSON string args for str_replace_editor", () => {
      const result = getToolDisplayMessage(
        "str_replace_editor",
        JSON.stringify({ command: "create", path: "/App.jsx" })
      );
      expect(result).toBe("Creating /App.jsx");
    });

    test("parses JSON string args for file_manager", () => {
      const result = getToolDisplayMessage(
        "file_manager",
        JSON.stringify({ command: "delete", path: "/old.jsx" })
      );
      expect(result).toBe("Deleting /old.jsx");
    });

    test("returns tool name for invalid JSON string", () => {
      const result = getToolDisplayMessage("str_replace_editor", "invalid json");
      expect(result).toBe("str_replace_editor");
    });
  });
});

describe("ToolInvocationBadge", () => {
  test("displays the correct message", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: "Success",
        }}
      />
    );

    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  });

  test("shows green dot when state is result with result", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: "Success",
        }}
      />
    );

    const greenDot = container.querySelector(".bg-emerald-500");
    expect(greenDot).not.toBeNull();
  });

  test("shows spinner when state is call", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "call",
        }}
      />
    );

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  test("shows spinner when state is result but result is undefined", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: undefined,
        }}
      />
    );

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  test("shows spinner when state is partial-call", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "partial-call",
        }}
      />
    );

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  test("falls back to tool name when args missing", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          state: "result",
          result: "Success",
        }}
      />
    );

    expect(screen.getByText("str_replace_editor")).toBeDefined();
  });
});
