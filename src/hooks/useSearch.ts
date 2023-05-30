import { defaultConfig } from "../uno.config";
import { useEffect, useState } from "react";
import { createGenerator } from "@unocss/core";
import { ResultItem } from "../share-docs/types";
import { createSearch } from "../share-docs";

const uno = createGenerator({}, defaultConfig);
export const searcher = createSearch({ uno });

export function useSearch(input: string) {
  const [searchResult, setSearchResult] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await searcher.search(input);

      setSearchResult(result);
      setIsLoading(false);
    })();
  }, [input]);

  return { searchResult, isLoading };
}
