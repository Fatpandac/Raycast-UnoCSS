import { createGenerator } from "unocss";
import { createSearch } from "../share-docs";
import { defaultConfig } from "../uno.config";

const uno = createGenerator({}, defaultConfig);
export const searcher = createSearch({ uno });