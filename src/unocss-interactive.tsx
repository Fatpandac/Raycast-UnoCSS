import { List } from "@raycast/api";
import { useSearch } from "./hooks";
import { ResultItem } from "./components";
import { useState } from "react";

export default function Command() {
  const [input, setInput] = useState("rand");
  const { searchResult, isLoading } = useSearch(input);

  return (
    <List
      navigationTitle="Search Beers"
      searchBarPlaceholder="Search your favorite beer"
      onSearchTextChange={(newValue) => {
        const defaultInput = "rand";
        if (!newValue) {
          setInput(defaultInput);
          return;
        }

        setInput(newValue);
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
