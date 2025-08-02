import Link from "@/components/Link";
import { countCategories } from "@/hooks/beta/useSortedCandidates";
import { CombinedData } from "@/types/DataTypes";

export function countString(detectionArray: CombinedData[]) {
  const categories = ["whale", "whale (AI)", "vessel", "other", "sighting"];

  const items = categories
    .map((category) => {
      const count = countCategories(detectionArray, category);

      // if (count === 0) return null;

      let label = category;
      if (category === "sighting" && count !== 1) {
        label += "s";
      }

      return (
        <Link
          key={category}
          href="#"
          color="rgba(255,255,255,.7)"
          sx={{
            whiteSpace: "nowrap",
          }}
        >
          {count} {label}
        </Link>
      );
    })
    .filter((c) => c); // filters out the null items

  console.log("items", items);

  // Interleave with separators
  const interleaved = items.flatMap((item, index) =>
    index < items.length - 1
      ? [item, <span key={`dot-${index}`}> · </span>]
      : [item],
  );

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {interleaved}
    </div>
  );
}
