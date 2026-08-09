import type { Language } from "@monkeytype/schemas/languages";
import type { Section } from "../../utils/json-data";

export async function getPoem(): Promise<false> {
  return false;
}
export async function getSection(_language: Language): Promise<Section> {
  throw new Error("This text source requires an internet connection");
}
