import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import type { Categories } from "~/lib/products/types";

interface ProductFiltersProps {
  categories: Categories;
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
}

export function ProductFilters({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: ProductFiltersProps) {
  const handleClearFilters = () => {
    onCategoryChange(undefined);
  };

  const hasActiveFilters = !!selectedCategoryId;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="category-filter" className="text-sm font-medium">
          Category:
        </label>
        <Select
          value={selectedCategoryId || "all"}
          onValueChange={(value) => {
            if (value === "all" || !value) {
              onCategoryChange(undefined);
            } else {
              onCategoryChange(value);
            }
          }}
        >
          <SelectTrigger id="category-filter" className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
