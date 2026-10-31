// NOTE: I couldn't inspect serupa-ds in this session (no file or shell access).
// The component names and prop names below (Input, Select, Switch, Slider and
// their value/onChange props) are assumptions, so check them against the
// installed package's types.
import { useState } from "react";
import { Input, Select, Switch, Slider } from "serupa-ds";

const CATEGORIES = ["All", "Books", "Music", "Games"] as const;
type Category = (typeof CATEGORIES)[number];

export interface ProductFilters {
  query: string;
  category: Category;
  inStockOnly: boolean;
  priceRange: [number, number];
}

interface ProductSearchBarProps {
  onChange?: (filters: ProductFilters) => void;
  maxPrice?: number;
}

export function ProductSearchBar({ onChange, maxPrice = 500 }: ProductSearchBarProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    query: "",
    category: "All",
    inStockOnly: false,
    priceRange: [0, maxPrice],
  });

  const update = (patch: Partial<ProductFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onChange?.(next);
  };

  const [min, max] = filters.priceRange;

  return (
    <form
      role="search"
      aria-label="Product search"
      onSubmit={(e) => e.preventDefault()}
      style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "end" }}
    >
      <Input
        label="Search products"
        type="search"
        placeholder="Search products…"
        value={filters.query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          update({ query: e.target.value })
        }
      />

      <Select
        label="Category"
        value={filters.category}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          update({ category: e.target.value as Category })
        }
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Switch
        label="In stock only"
        checked={filters.inStockOnly}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          update({ inStockOnly: e.target.checked })
        }
      />

      <Slider
        label={`Price: $${min} – $${max}`}
        min={0}
        max={maxPrice}
        step={5}
        value={filters.priceRange}
        onChange={(value: [number, number]) => update({ priceRange: value })}
      />
    </form>
  );
}

export default ProductSearchBar;
