import { useState } from 'react';
import { Button, Field, SearchInput, Select, Slider, Stack, Switch, Text } from 'serupa-ds';

const CATEGORIES = ['All', 'Books', 'Music', 'Games'] as const;
type Category = (typeof CATEGORIES)[number];

const PRICE_MIN = 0;
const PRICE_MAX = 500;

export interface ProductSearchValues {
  query: string;
  category: Category;
  inStockOnly: boolean;
  priceRange: [number, number];
}

interface ProductSearchBarProps {
  onSearch?: (values: ProductSearchValues) => void;
}

export function ProductSearchBar({ onSearch }: ProductSearchBarProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.({ query, category, inStockOnly, priceRange });
  };

  const reset = () => {
    setQuery('');
    setCategory('All');
    setInStockOnly(false);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    onSearch?.({
      query: '',
      category: 'All',
      inStockOnly: false,
      priceRange: [PRICE_MIN, PRICE_MAX],
    });
  };

  return (
    <form
      role="search"
      aria-label="Products"
      onSubmit={submit}
      className="p-4 bg-surface rounded-md shadow-md"
    >
      <Stack gap={4}>
        <Stack direction="row" gap={3} className="items-end">
          <Field label="Search products" className="flex-1">
            <SearchInput
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Title, author, artist…"
            />
          </Field>

          <Field label="Category">
            <Select
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCategory(e.target.value as Category)
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </Stack>

        <Stack direction="row" gap={6} className="items-end flex-wrap">
          <Switch
            checked={inStockOnly}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInStockOnly(e.target.checked)}
          >
            In stock only
          </Switch>

          <Field
            label="Price range"
            hint={`$${priceRange[0]} – $${priceRange[1]}`}
            className="flex-1"
          >
            <Slider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={5}
              value={priceRange}
              onChange={(v: number | number[]) => {
                if (Array.isArray(v)) setPriceRange([v[0], v[1]]);
              }}
            />
          </Field>
        </Stack>

        <Stack direction="row" gap={2} className="justify-end">
          <Button type="button" variant="ghost" onClick={reset}>
            Reset
          </Button>
          <Button type="submit">Search</Button>
        </Stack>

        <Text className="text-text-muted" role="status">
          {category === 'All' ? 'All categories' : category}
          {inStockOnly ? ', in stock only' : ''}, ${priceRange[0]} to ${priceRange[1]}
        </Text>
      </Stack>
    </form>
  );
}

export default ProductSearchBar;
