import { List } from "@raycast/api";
import { useSearch } from "./hooks/useSearch";
import { ResultItem } from "./components/resultItem";
import { useState } from "react";

export default function Command() {
  const [input, setInput] = useState("rand")
  const { searchResult, isLoading } = useSearch(input);

  return (
    <List
      navigationTitle="Search Beers"
      searchBarPlaceholder="Search your favorite beer"
      onSearchTextChange={(newValue) => {
        if (!newValue) return;

        setInput(newValue)
      }}
      filtering={false}
      isShowingDetail
      isLoading={isLoading}
    >
      {searchResult.map((item) => (
        <ResultItem item={item} />
      ))}
    </List>
  );
}
