import { test, expect } from "vitest";
import { cn } from "@/lib/utils";

test("cn merges class names", () => {
  const result = cn("foo", "bar");
  expect(result).toBe("foo bar");
});

test("cn handles conditional classes", () => {
  const result = cn("base", true && "included", false && "excluded");
  expect(result).toBe("base included");
});

test("cn handles undefined and null", () => {
  const result = cn("base", undefined, null, "end");
  expect(result).toBe("base end");
});

test("cn merges Tailwind classes correctly", () => {
  const result = cn("px-2 py-1", "px-4");
  expect(result).toBe("py-1 px-4");
});

test("cn handles conflicting Tailwind classes", () => {
  const result = cn("text-red-500", "text-blue-500");
  expect(result).toBe("text-blue-500");
});

test("cn handles array of classes", () => {
  const result = cn(["foo", "bar"], "baz");
  expect(result).toBe("foo bar baz");
});

test("cn handles object notation", () => {
  const result = cn({
    base: true,
    active: true,
    disabled: false,
  });
  expect(result).toBe("base active");
});

test("cn returns empty string for no arguments", () => {
  const result = cn();
  expect(result).toBe("");
});

test("cn handles complex Tailwind merging", () => {
  const result = cn(
    "bg-red-500 hover:bg-red-600",
    "bg-blue-500"
  );
  expect(result).toBe("hover:bg-red-600 bg-blue-500");
});

test("cn handles responsive variants", () => {
  const result = cn("p-2 md:p-4", "p-3");
  expect(result).toBe("md:p-4 p-3");
});
