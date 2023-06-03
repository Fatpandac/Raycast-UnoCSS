import { List } from "@raycast/api";
import { getAvatarIcon } from "@raycast/utils";
import { rgbToHex, searcher } from "../utils";
import { Variant, notNull } from "unocss";
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

  return `### Variants
${variantDetail}`;
};

function getRegex101Link(regex: RegExp, text: string) {
  return `https://regex101.com/?regex=${encodeURIComponent(regex.source)}&flag=${encodeURIComponent(
    regex.flags
  )}&testString=${encodeURIComponent(text)}`;
}

function getRegexperLink(regex: RegExp) {
  return `https://regexper.com/#${encodeURIComponent(regex.source)}`;
}

function getGitHubCodeSearchLink(key: RegExp | string, repo = "unocss/unocss") {
  // https://docs.github.com/en/search-github/searching-on-github/searching-code#search-within-a-users-or-organizations-repositories
  const separator = " ";
  return `https://github.com/search?type=code&q=${encodeURI(`repo:${repo}`)}${separator}"${encodeURIComponent(
    String(key)
  )}"`;
}

const getRulesDetail = (item: RuleItem) => {
  let rulesDetail = "### Rules \n";

  rulesDetail += item.context?.rules
    ?.map((r) => {
      if (typeof r[0] === "string") {
        const preset = searcher.getPresetOfRule(r);
        return (
          `[${preset?.name}](https://npmjs.com/package/${preset?.name})\n` + 
          "```text\n" +
          `${r[0]}\n` +
          "```\n"
        ); // prettier-ignore
      } else if (typeof r[0] !== "string") {
        return (
          "```regex\n" +
          `${r[0]}\n` +
          "```\n" +
          `[Regex101](${getRegex101Link(r[0], item.class)})\t` +
          `[Regexper](${getRegexperLink(r[0])})\t` +
          `[GitHub](${getGitHubCodeSearchLink(r[0])})\t`
        );
      }
    })
    .join("\n");

  return rulesDetail;
};

const getLayersDetail = (item: RuleItem) => {
  if (!item.layers?.length) return;
  let layersDetail = "### Layers \n";
  item.layers.map((l) => {
    layersDetail = `${layersDetail}\n${l}`;
  });

  return layersDetail;
};

const getCSSDetail = (item: RuleItem) => {
  return (
    "### CSS \n" +
    "```css\n" +
    `${item.css?.replace(/\n$/, "")?.replaceAll(/url(.*)/g, 'url(data:image/svg+xml;xxx)')}\n` +
    "```"
  ); // prettier-ignore
};

const getIconDetail = (item: RuleItem) => {
  const imageUrls = item.urls?.filter((i) => i.startsWith("data:image") || i.match(/\.(png|jpg|jpeg|svg)$/gi));
  if (!imageUrls?.length) return;

  return (
    "### Icon \n" +
    imageUrls
      .map((i) => {
        const [head, data] = i.split("utf8,");

        return `<img src="${`${head}base64,${btoa(
          decodeURI(data)
            .replaceAll("%23", "#")
            .replace(/width='.*?'/, "width='40px'")
            .replace(/height='.*?'/, "height='40px'")
        )}`}" alt="icon"/> \n`;
      })
      .join("")
  );
};

const getColorsDetail = (item: RuleItem) => {
  if (!item.colors?.length) return;

  let colorsDetail = "### Colors\n";
  const generateColorsSVG = (color: string) => `
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlnsXlink="http://www.w3.org/1999/xlink"
  width='700'
  height='100'
  
  fill='${rgbToHex(color)}'
>
<polygon points='0,0 700,0 700,100 0,100 0,0'>
</polygon>
<text x='250' y='75' style='font-size: 50pt;' fill='white'>A</text>
<text x='400' y='75' style='font-size: 50pt;' fill='black'>A</text>
</svg>
`;
  colorsDetail += item.colors
    .map((c) => {
      return `<img src="${encodeURI("data:image/svg+xml;base64," + btoa(generateColorsSVG(c)))}" alt="Colors SVG" />\n`;
    })
    .join("");

  return colorsDetail;
};

const getMDNDetail = (item: RuleItem) => {
  const docs = getDocs(item);
  let MDNDetail = "### MDN Docs\n";

  MDNDetail += docs.map((doc) => `[MDN: ${doc.title}](${doc.url})`).join("\n\n");

  return MDNDetail;
};

const getAliasDetail = (item: RuleItem) => {
  const alias = searcher.getAliasOf(item);
  if (!alias.length) return;

  let aliasDetail = "### Alias\n";
  aliasDetail += alias.map((a) => `\`${a.class}\` `).join("");

  return aliasDetail;
};

const getSameRuleDetail = (item: RuleItem) => {
  const sameRules = searcher.getSameRules(item);
  if (!sameRules.length) return;

  let sameRulesDetail = "### Same Rule";
  sameRulesDetail += sameRules.map((s) => `\`${s.class}\` `).join("");

  return sameRulesDetail;
};

function DetailRule(props: { item: RuleItem }) {
  const { item } = props;

  const detailMarkdown = [
    getShortCutsDetail,
    getVariantsDetail,
    getRulesDetail,
    getLayersDetail,
    getIconDetail,
    getCSSDetail,
    getColorsDetail,
    getMDNDetail,
    getAliasDetail,
    getSameRuleDetail,
  ]
    .map((getDetailFunc) => getDetailFunc(item))
    .filter(notNull)
    .join("\n");

  return <List.Item.Detail markdown={detailMarkdown} />;
}

function getResultIcon(item: ResultItem) {
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
      icon={getResultIcon(item)}
      title={item.type === "mdn" ? item.title : (item as RuleItem).class}
      detail={item.type === "mdn" ? <DetailMdn item={item} /> : <DetailRule item={item as RuleItem} />}
    />
  );
}
