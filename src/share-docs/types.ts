import type { RuleContext } from "@unocss/core";

export interface DocItem {
  type: "mdn" | "caniuse";
  title: string;
  url: string;
  summary?: string;
}

export interface RuleItem {
  type: "rule";
  class: string;
  css?: string;
  body?: string;
  context?: RuleContext;
  colors?: string[];
  features?: string[];
  layers?: string[];
  urls?: string[];
}

export type ResultItem = DocItem | RuleItem;
