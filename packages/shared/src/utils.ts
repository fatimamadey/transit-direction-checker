import type { SourceType } from "./types";

export function slugifyBoardName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function normalizeSourceValue(type: SourceType, value: string) {
  const trimmed = value.trim().replace(/^https:\/\/github\.com\//, "").replace(/\/+$/, "");
  return type === "repo" ? trimmed.toLowerCase() : trimmed.replace(/^@/, "").toLowerCase();
}

export function getGitHubEventsUrl(type: SourceType, value: string) {
  if (type === "repo") {
    return `https://api.github.com/repos/${value}/events`;
  }

  return `https://api.github.com/users/${value}/events/public`;
}
