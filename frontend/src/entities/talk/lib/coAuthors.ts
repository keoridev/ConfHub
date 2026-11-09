import { CoAuthor } from "../model/types";

// The API returns co-authors as objects; older data and requests may still use plain strings.
export const coAuthorLabel = (ca: CoAuthor): string => {
  if (typeof ca === "string") return ca;

  const name = (ca.name || ca.fullName || "").trim();
  // The web form stores details inside the name: "ФИО (ВУЗ, группа)".
  if (name.includes("(")) return name;

  const details = [ca.university, ca.group || ca.gradeOrGroup]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  return details ? `${name} (${details})` : name;
};

export const coAuthorLabels = (coAuthors: CoAuthor[] | undefined | null): string[] =>
  (coAuthors || []).map(coAuthorLabel).filter(Boolean);
