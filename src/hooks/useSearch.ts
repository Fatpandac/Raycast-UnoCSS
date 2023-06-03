import { useEffect, useState } from "react";
import { ResultItem } from "../share-docs/types";
import { searcher } from "../utils/search";

export function useSearch(input: string) {
  const [searchResult, setSearchResult] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const result = await searcher.search(input);

      setSearchResult(result);
      setIsLoading(false);
    })();
  }, [input]);

  return { searchResult, isLoading };
}
