// eslint-disable-next-line no-restricted-imports
import { defineConfig, presetAttributify, presetIcons, presetUno } from "unocss";

export const defaultConfig = defineConfig<object>({
  details: true,
  presets: [presetUno(), presetAttributify()],
});

export default defineConfig({
  rules: [["custom-rule", { color: "red" }]],
  shortcuts: {
    "custom-shortcut": "text-lg text-orange hover:text-teal",
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: "https://esm.sh/",
    }),
  ],
});
