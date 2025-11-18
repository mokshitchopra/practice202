import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { searchItems, ItemSearchParams } from "@/lib/api";
import { Item, ItemCategory, ItemCondition } from "@/types";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const searchParams: ItemSearchParams = {};
  if (searchTerm) searchParams.search = searchTerm;
  if (selectedCategory) searchParams.category = selectedCategory;
  if (selectedCondition) searchParams.condition = selectedCondition;
  if (minPrice && !isNaN(parseFloat(minPrice))) searchParams.min_price = parseFloat(minPrice);
  if (maxPrice && !isNaN(parseFloat(maxPrice))) searchParams.max_price = parseFloat(maxPrice);

  const { data: items, isLoading, error } = useQuery<Item[]>({
    queryKey: ["items", searchParams],
    queryFn: () => searchItems(searchParams),
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedCondition("");
    setMinPrice("");
    setMaxPrice("");
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedCondition || minPrice || maxPrice;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground">Loading items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-destructive">
            Error loading items: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-12 px-4 shadow-lg overflow-hidden" style={{
        background: "linear-gradient(135deg, hsl(207 100% 32%) 0%, hsl(207 100% 40%) 30%, hsl(43 82% 53%) 70%)"
      }}>
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Spartan Marketplace
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Buy, sell, and trade with your fellow Spartans
          </p>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative shadow-glow rounded-lg">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Search for items..."
              className="pl-12 h-14 text-lg border-2 focus-visible:ring-offset-0 focus-visible:ring-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          {hasActiveFilters && (
            <Button variant="destructive" onClick={handleClearFilters} size="sm">
              Clear All
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value={ItemCategory.TEXTBOOKS}>Textbooks</option>
                  <option value={ItemCategory.ELECTRONICS}>Electronics</option>
                  <option value={ItemCategory.FURNITURE}>Furniture</option>
                  <option value={ItemCategory.CLOTHING}>Clothing</option>
                  <option value={ItemCategory.SPORTS_FITNESS}>Sports & Fitness</option>
                  <option value={ItemCategory.OTHER}>Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium mb-2">
                  Condition
                </label>
                <select
                  id="condition"
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Conditions</option>
                  <option value={ItemCondition.NEW}>New</option>
                  <option value={ItemCondition.LIKE_NEW}>Like New</option>
                  <option value={ItemCondition.GOOD}>Good</option>
                  <option value={ItemCondition.FAIR}>Fair</option>
                  <option value={ItemCondition.POOR}>Poor</option>
                </select>
              </div>

              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium mb-2">
                  Min Price ($)
                </label>
                <Input
                  id="minPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                />
              </div>

              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium mb-2">
                  Max Price ($)
                </label>
                <Input
                  id="maxPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Available Listings</h2>
          <p className="text-lg text-muted-foreground">
            {items?.length || 0} {(items?.length || 0) === 1 ? "item" : "items"} found
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>

        {items && items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">No items found matching your search.</p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items?.map((item) => (
              <ListingCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                condition={item.condition}
                category={item.category}
                location={item.location}
                imageUrl={item.item_url}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
