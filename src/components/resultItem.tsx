import { List } from "@raycast/api";
import { getAvatarIcon } from "@raycast/utils";
import { searcher } from "../hooks/useSearch";
import { Variant } from "unocss";
import { getDocs } from "../share-docs/utils";
import type { DocItem, ResultItem, RuleItem } from "../share-docs/types";

function DetailMdn(props: { item: DocItem }) {
  const { item } = props;
  const detailMarkdown = `
  ### Link
  MDN: [${item.title}](${item.url})

  Can I Use: [${item.title}](${item.url})
  `;
  return <List.Item.Detail markdown={detailMarkdown} />;
}

const getShortCutsDetail = (item: RuleItem) => {
  if (!item.context?.shortcuts?.length) return;

  const shortCuts = item.context.shortcuts.map((r) => `${r[0]} -> ${r[1]}`).join("\n");
  return `
    ### ShortCuts
    ${shortCuts}
    `;
};

const getVariantsDetail = (item: RuleItem) => {
  const first = item.context?.variants?.[0];
  const handlers = item.context?.variantHandlers;
  const variantSteps: {
    variant?: Variant;
    name?: string;
    result: string;
  }[] = [];

  variantSteps.push({
    variant: first,
    name: first?.name,
    result: item.class,
  });

  if (handlers) {
    handlers.forEach((h, i) => {
      const v = item.context?.variants?.[i + 1];
      variantSteps.push({
        variant: v,
        name: v?.name,
        result: h.matcher,
      });
    });
  }

  if (variantSteps.length <= 1) return;
  const variantDetail = variantSteps
    .map((s, idx) => {
      const preset = searcher.getPresetOfVariant(s.variant);
      if (idx < variantSteps.length - 1) {
        return `
${preset?.name ? `[${preset?.name}](https://npmjs.com/package/${preset?.name})` : `(inline)`} > ${
          s.name || "(anonymous)"
        }

${s.result}
`;
      }
    })
    .join("");

  return `
### Variants
${variantDetail}
`;
};

const getRulesDetail = (item: RuleItem) => {
  return item.context?.rules
    ?.map((r) => {
      if (typeof r[0] === "string") {
        const preset = searcher.getPresetOfRule(r);
        return `
### Rules 
[${preset?.name}](https://npmjs.com/package/${preset?.name})
\`\`\`regex
${r[0]}
\`\`\`
      `;
      } else if (typeof r[0] !== "string") {
        return `
### Rules
\`\`\`
${r[0]}
\`\`\`
      `;
      }
    })
    .join();
};

const getLayersDetail = (item: RuleItem) => {
  if (!item.layers?.length) return;
  let layersDetail = "### Layers";
  item.layers.map((l) => {
    layersDetail = `${layersDetail}\n${l}`;
  });

  return layersDetail;
};

const getCSSDetail = (item: RuleItem) => {
  return `
### CSS
\`\`\`css
${item.css?.replace(/\n$/, "")}
\`\`\`
  `;
};

const getMDNDetail = (item: RuleItem) => {
  const docs = getDocs(item);
  let MDNDetail = "### MDN";

  MDNDetail += docs
    .map((doc) => {
      return `
[${doc.title}](${doc.url})
`;
    })
    .join("\n");

  return MDNDetail;
};

function DetailRule(props: { item: RuleItem }) {
  const { item } = props;

  const detailMarkdown = [
    getShortCutsDetail(item),
    getVariantsDetail(item),
    getRulesDetail(item),
    getLayersDetail(item),
    getCSSDetail(item),
    getMDNDetail(item)
  ].join("\n"); // prettier-ignore

  return <List.Item.Detail markdown={detailMarkdown} />;
}

function getIcon(item: ResultItem) {
  if (item.type === "mdn") {
    return getAvatarIcon("M");
  } else {
    item = item as RuleItem;
    if (item.context?.shortcuts?.length) {
      return getAvatarIcon("S");
    } else if (item.context?.variants?.length) {
      return getAvatarIcon("V");
    } else if (item.context?.rules?.every((i) => typeof i[0] === "string")) {
      return getAvatarIcon("T");
    } else {
      return getAvatarIcon("D");
    }
  }
}

export function ResultItem(props: { item: ResultItem }) {
  const { item } = props;

  return (
    <List.Item
      icon={getIcon(item)}
      title={item.type === "mdn" ? item.title : (item as RuleItem).class}
      detail={item.type === "mdn" ? <DetailMdn item={item} /> : <DetailRule item={item as RuleItem} />}
    />
  );
}
