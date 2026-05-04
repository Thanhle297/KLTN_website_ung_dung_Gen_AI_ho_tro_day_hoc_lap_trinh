const categoryNameCollator = new Intl.Collator("vi", {
  numeric: true,
  sensitivity: "base",
});

export function sortCategoriesByName(categories) {
  return [...categories].sort((a, b) => {
    const nameCompare = categoryNameCollator.compare(
      a.name || "",
      b.name || ""
    );
    if (nameCompare !== 0) return nameCompare;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}
