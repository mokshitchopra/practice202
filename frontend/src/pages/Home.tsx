import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import ComparisonPopup from "@/components/ComparisonPopup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Clock, ArrowUpDown, EyeOff } from "lucide-react";
import { searchItems, ItemSearchParams, getItem } from "@/lib/api";
import { Item, ItemCategory, ItemCondition, ItemStatus } from "@/types";
import { 
  debounce, 
  getSearchHistory, 
  addToSearchHistory, 
  clearSearchHistory, 
  getRecentlyViewed,
  removeFromRecentlyViewed,
  isRecentlyViewedDismissed,
  setRecentlyViewedDismissed
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SortOption = "relevance" | "price_low" | "price_high" | "date_new" | "date_old" | "title_asc" | "title_desc";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState("");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<Item[]>([]);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(true);

  // Debounced search term update
  const debouncedSearchUpdate = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 500),
    []
  );

  // Debounced price updates
  const debouncedMinPriceUpdate = useCallback(
    debounce((value: string) => {
      setDebouncedMinPrice(value);
    }, 500),
    []
  );

  const debouncedMaxPriceUpdate = useCallback(
    debounce((value: string) => {
      setDebouncedMaxPrice(value);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearchUpdate(searchTerm);
  }, [searchTerm, debouncedSearchUpdate]);

  useEffect(() => {
    debouncedMinPriceUpdate(minPrice);
  }, [minPrice, debouncedMinPriceUpdate]);

  useEffect(() => {
    debouncedMaxPriceUpdate(maxPrice);
  }, [maxPrice, debouncedMaxPriceUpdate]);

  // Load recently viewed items
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      if (isRecentlyViewedDismissed()) {
        setShowRecentlyViewed(false);
        return;
      }
      const recentIds = getRecentlyViewed();
      if (recentIds.length > 0) {
        const items = await Promise.all(
          recentIds.slice(0, 6).map(async (id) => {
            try {
              return await getItem(id);
            } catch {
              return null;
            }
          })
        );
        setRecentlyViewedItems(items.filter((item): item is Item => item !== null));
      }
    };
    loadRecentlyViewed();
  }, []);

  const handleDismissRecentlyViewed = () => {
    setRecentlyViewedDismissed(true);
    setShowRecentlyViewed(false);
  };

  const handleRemoveFromRecentlyViewed = (itemId: number) => {
    removeFromRecentlyViewed(itemId);
    setRecentlyViewedItems(prev => prev.filter(item => item.id !== itemId));
  };

const filterParams = useMemo(() => {
  const params: ItemSearchParams = {};
  if (debouncedSearchTerm) params.search = debouncedSearchTerm;
  if (selectedCategory) params.category = selectedCategory;
  if (selectedCondition) params.condition = selectedCondition;
  if (debouncedMinPrice && !isNaN(parseFloat(debouncedMinPrice))) {
    params.min_price = parseFloat(debouncedMinPrice);
  }
  if (debouncedMaxPrice && !isNaN(parseFloat(debouncedMaxPrice))) {
    params.max_price = parseFloat(debouncedMaxPrice);
  }
  return params;
}, [debouncedSearchTerm, selectedCategory, selectedCondition, debouncedMinPrice, debouncedMaxPrice]);

const [showSold, setShowSold] = useState(false);

const { data: items, isLoading, error } = useQuery<Item[]>({
  queryKey: ["items", filterParams, showSold],
  queryFn: async () => {
    const [available, reserved, sold] = await Promise.all([
      searchItems({ ...filterParams, status: ItemStatus.AVAILABLE }),
      searchItems({ ...filterParams, status: ItemStatus.RESERVED }),
      showSold ? searchItems({ ...filterParams, status: ItemStatus.SOLD }) : Promise.resolve([]),
    ]);
    const combined = [...available, ...reserved, ...(showSold ? sold : [])];
    const uniqueMap = new Map<number, Item>();
    combined.forEach((item) => uniqueMap.set(item.id, item));
    return Array.from(uniqueMap.values());
  },
});

  // Sort items
  const sortedItems = useMemo(() => {
    if (!items) return [];
    const sorted = [...items];
    
    switch (sortBy) {
      case "price_low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price_high":
        return sorted.sort((a, b) => b.price - a.price);
      case "date_new":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "date_old":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "title_asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "title_desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [items, sortBy]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedCategory("");
    setSelectedCondition("");
    setMinPrice("");
    setMaxPrice("");
    setDebouncedMinPrice("");
    setDebouncedMaxPrice("");
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      addToSearchHistory(query);
    }
    setShowSearchHistory(false);
  };

  const searchHistory = getSearchHistory();

  const hasActiveFilters = searchTerm || selectedCategory || selectedCondition || debouncedMinPrice || debouncedMaxPrice;

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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-base text-destructive animate-fade-in">
            Error loading items: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Recently Viewed Section */}
        {showRecentlyViewed && recentlyViewedItems.length > 0 && !hasActiveFilters && (
          <Card className="mb-8 border-0 shadow-sm bg-transparent">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Recently Viewed
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismissRecentlyViewed}
                    className="text-muted-foreground hover:text-foreground rounded-full h-8 px-3 text-xs"
                  >
                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {recentlyViewedItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm transition-all duration-200"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFromRecentlyViewed(item.id);
                      }}
                      aria-label="Remove from recently viewed"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <ListingCard
                      id={item.id}
                      title={item.title}
                      price={item.price}
                      condition={item.condition}
                      category={item.category}
                      location={item.location}
                      imageUrl={item.item_url}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search for items..."
              className="pl-12 pr-12 h-14 text-base border border-border/60 shadow-sm hover:shadow-md focus-visible:shadow-md transition-all duration-200"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchHistory(true);
              }}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchTerm.trim()) {
                  handleSearch(searchTerm);
                }
              }}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setShowSearchHistory(false);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-full p-1 hover:bg-muted/50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Search History Dropdown */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border/60 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-scale-in">
                <div className="p-2">
                  <div className="flex items-center justify-between px-3 py-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs rounded-full px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSearchHistory();
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  {searchHistory.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(query)}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 rounded-lg text-sm flex items-center gap-2 transition-colors duration-150"
                    >
                      <Search className="w-4 h-4 text-muted-foreground" />
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
              className="rounded-full"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters} size="sm" className="rounded-full">
                Clear All
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[160px] rounded-lg border-border/60">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="date_new">Newest First</SelectItem>
                <SelectItem value="date_old">Oldest First</SelectItem>
                <SelectItem value="title_asc">Title: A-Z</SelectItem>
                <SelectItem value="title_desc">Title: Z-A</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                className="rounded border border-input w-4 h-4 cursor-pointer"
                checked={showSold}
                onChange={(e) => setShowSold(e.target.checked)}
              />
              Show sold items
            </label>
          </div>
        </div>

        {showFilters && (
          <div className="bg-card border border-border/60 rounded-xl p-6 mb-6 shadow-sm animate-scale-in">
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

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">Available Listings</h2>
          <p className="text-sm text-muted-foreground">
            {sortedItems?.length || 0} {(sortedItems?.length || 0) === 1 ? "item" : "items"} found
            {hasActiveFilters && " (filtered)"}
            {sortBy !== "relevance" && ` • Sorted by ${sortBy.replace("_", " ")}`}
          </p>
        </div>

        {sortedItems && sortedItems.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-base text-muted-foreground mb-6">No items found matching your search.</p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} className="rounded-full">Clear Filters</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedItems?.map((item, index) => (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <ListingCard
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  condition={item.condition}
                  category={item.category}
                  location={item.location}
                  imageUrl={item.item_url}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Comparison Popup */}
      <ComparisonPopup />
    </div>
  );
}
