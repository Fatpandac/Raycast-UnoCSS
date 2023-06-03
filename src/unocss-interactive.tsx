import { List } from "@raycast/api";
import { useState } from "react";
import { ResultItem } from "./components";
import { useSearch } from "./hooks";

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
