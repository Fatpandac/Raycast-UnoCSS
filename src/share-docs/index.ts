/*
 **  Code below copied from UnoCSS
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rule, UnoGenerator, Variant } from "@unocss/core";
import { notNull, uniq } from "@unocss/core";
import Fuse from "fuse.js";
import { createAutocomplete } from "@unocss/autocomplete";
import { computed, reactive, toRaw, ref } from "@vue/reactivity";
import type { DocItem, ResultItem, RuleItem } from "./types";
import { extractColors, formatCSS, sampleArray } from "./utils";
import r from "./data/mdn-index.json";

export const docs = ref<DocItem[]>([]);
docs.value = (r as DocItem[]).map((i) => {
  i.type = "mdn";
  return i;
});

interface SearchState {
  uno: UnoGenerator;
  limit?: number;
}

export function createSearch({ uno, limit = 50 }: SearchState) {
  const ac = createAutocomplete(uno);
  const matchedMap = reactive(new Map<string, RuleItem>());
  const featuresMap = reactive(new Map<string, Set<RuleItem>>());

  let fuseCollection: ResultItem[] = [];

  const fuse = new Fuse<ResultItem>(fuseCollection, {
    keys: [
      {
        name: "class",
        weight: 0.5,
      },
      {
        name: "body",
        weight: 0.4,
      },
      {
        name: "title",
        weight: 0.3,
      },
      {
        name: "keywords",
        weight: 0.3,
      },
    ],
    isCaseSensitive: false,
    ignoreLocation: true,
    includeScore: true,
  });
  const docsFuse = computed(
    () =>
      new Fuse<ResultItem>(docs.value, {
        keys: ["title", "summary"],
        isCaseSensitive: false,
      })
  );

  const az09 = Array.from("abcdefghijklmnopqrstuvwxyz01234567890");

  uno.events.on("config", reset);

  let _fusePrepare: Promise<void> | undefined;
  async function search(input: string) {
    _fusePrepare = _fusePrepare || prepareFuse();
    await _fusePrepare;

    input = input.trim();

    // mdn
    if (input.match(/^(mdn|doc):/)) {
      input = input.slice(4).trim();
      if (!input) return docs.value.slice(0, limit);
      return docsFuse.value.search(input, { limit }).map((i) => i.item);
    }

    // random
    if (input.match(/^rand(om)?:/)) return sampleArray(fuseCollection, limit);

    const parts = input.split(/\s/g).filter(notNull);
    const extract = await generateForMultiple(parts);

    await suggestMultiple([
      ...parts,
      ...parts.map((i) => `${i}-`),
      ...parts.flatMap((i) => az09.map((a) => `${i}-${a}`)),
    ]).then((r) => generateForMultiple(r));

    const searchResult = uniq(
      [...fuse.search(input, { limit: limit * 2 }), ...parts.flatMap((i) => fuse.search(i, { limit: limit * 2 }))]
        .filter((i) => i.score! <= 0.5)
        .sort((a, b) => a.score! - b.score!)
        .map((i) => i.item)
    ).slice(0, limit);

    return uniq([...extract, ...searchResult].filter(notNull));
  }

  async function suggestMultiple(str: string[]) {
    return uniq((await Promise.all(str.map((i) => ac.suggest(i)))).flat());
  }

  async function generateForMultiple(str: string[]) {
    return uniq(await Promise.all(str.map((i) => generateFor(i)))).filter(notNull);
  }

  async function prepareFuse() {
    await Promise.all(Array.from(await enumerateAutocomplete()).map(async (i) => await generateFor(i)));
  }

  async function enumerateAutocomplete() {
    const matched = new Set<string>();
    const a2z = Array.from("abcdefghijklmnopqrstuvwxyz");
    const a2zd = [...a2z, "-"];

    const keys = a2z.flatMap((i) => [i, ...a2zd.map((j) => `${i}${j}`)]);

    await Promise.all(keys.map((key) => ac.suggest(key).then((i) => i.forEach((j) => matched.add(j)))));

    return matched;
  }

  const _generatePromiseMap = new Map<string, Promise<RuleItem | undefined>>();
  async function _generateFor(input: string) {
    if (matchedMap.has(input)) return matchedMap.get(input);

    const token = await uno.parseToken(input);
    if (!token?.length) return;

    const last = token[token.length - 1]!;

    const generate = await uno.generate(new Set([input]), {
      preflights: false,
      minify: true,
    });
    const css = await formatCSS(generate.css);

    // props
    const features = getFeatureUsage(css);

    matchedMap.set(input, {
      type: "rule",
      class: input,
      body: last[2].replace(/([:;])/g, "$1 "),
      context: last[5],
      css,
      colors: extractColors(css),
      features,
      layers: generate.layers.filter((i) => i !== "default"),
      urls: getUrls(css),
    });

    const item = matchedMap.get(input)!;

    features.forEach((i) => {
      if (!featuresMap.has(i)) featuresMap.set(i, new Set());
      featuresMap.get(i)!.add(item);
    });

    if (!fuseCollection.includes(item)) fuse.add(item);

    return item;
  }

  function generateFor(input: string) {
    if (!_generatePromiseMap.has(input))
      _generatePromiseMap.set(input, _generateFor(input).catch((e) => console.error(e)) as any);
    return _generatePromiseMap.get(input);
  }

  function getPresetOfRule(rule?: Rule) {
    if (!rule) return;
    const r = toRaw(rule);
    return uno.config.presets?.flat().find((i) => i.rules?.find((i) => i === r || i === rule));
  }

  function getPresetOfVariant(variant?: Variant) {
    if (!variant) return;
    const v = toRaw(variant);
    return uno.config.presets?.flat().find((i) => i.variants?.find((i) => i === v || i === variant));
  }

  function getFeatureUsage(css: string) {
    const props = uniq([...css.matchAll(/^\s+(\w[\w-]+)\:/gm)].map((i) => i[1]));
    const functions = uniq([...css.matchAll(/\b(\w+)\(/gm)].map((i) => `${i[1]}()`));
    const pseudo = uniq([...css.matchAll(/\:([\w-]+)/gm)].map((i) => `:${i[1]}`));

    return [...props, ...functions, ...pseudo].filter((i) => docs.value.find((s: { title: string }) => s.title === i));
  }

  function getUrls(css: string) {
    return uniq([...css.matchAll(/\burl\(([^)]+)\)/gm)].map((i) => i[1])).map((i) =>
      i.match(/^(['"]).*\1$/) ? i.slice(1, -1) : i
    );
  }

  function getUtilsOfFeature(name: string) {
    return [...(featuresMap.get(name) || [])];
  }

  function getAliasOf(item: RuleItem) {
    return [...matchedMap.values()].filter((i) => i.body === item.body && i.class !== item.class);
  }

  function getItemId(item: ResultItem) {
    if (item.type !== "rule") return `${item.type}:${item.title}`;
    return item.class;
  }

  function getSameRules(item: RuleItem) {
    if (!item.context?.rules?.length) return [];
    const raw = toRaw(item);
    return [...matchedMap.values()]
      .filter((i) => {
        if (raw === toRaw(i)) return false;
        if (i.context?.rules?.length !== item.context?.rules?.length) return false;
        return i.context?.rules?.every((j, k) => j === item.context?.rules?.[k]);
      })
      .sort((a, b) => a.class.localeCompare(b.class));
  }

  function reset() {
    matchedMap.clear();
    featuresMap.clear();
    ac.reset();
    _fusePrepare = undefined;
    _generatePromiseMap.clear();
    fuseCollection = [...docs.value];
    fuse.setCollection(fuseCollection);
  }

  function getSearchCount() {
    return fuseCollection.length;
  }

  function getInfo() {
    return {
      version: uno.version,
      presetsCount: uno.config.presets.length,
      rulesCount: uno.config.rulesSize,
      variantsCount: uno.config.variants.length,
      shortcutsCount: uno.config.shortcuts.length,
      searchCount: getSearchCount(),
    };
  }

  function getThemeColors() {
    return (uno.config.theme as any).colors || {};
  }

  return {
    uno,
    reset,
    search,
    fuse,
    generateFor,
    getPresetOfRule,
    getPresetOfVariant,
    getUtilsOfFeature,
    getAliasOf,
    getItemId,
    getSameRules,
    getSearchCount,
    getInfo,
    getThemeColors,
  };
}
