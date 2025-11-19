import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MyItemCard from "@/components/MyItemCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getMyItems, createItem, uploadFile } from "@/lib/api";
import { authStore } from "@/store/authStore";
import { ItemCategory, ItemCondition, ItemStatus } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function MyItems() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: ItemCategory.OTHER,
    condition: ItemCondition.GOOD,
    location: "",
    is_negotiable: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["myItems"],
    queryFn: getMyItems,
    enabled: authStore.isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      toast.success("Listing created successfully!");
      setOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create listing");
    },
  });


  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      category: ItemCategory.OTHER,
      condition: ItemCondition.GOOD,
      location: "",
      is_negotiable: true,
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    let imageUrl: string | undefined;

    if (selectedFile) {
      setUploading(true);
      try {
        imageUrl = await uploadFile(selectedFile, "items");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload image");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      price: price,
      condition: formData.condition,
      category: formData.category,
      location: formData.location || undefined,
      is_negotiable: formData.is_negotiable,
      item_url: imageUrl,
    });
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];
    
    // Filter by status
    let filtered = items;
    if (statusFilter !== "all") {
      filtered = items.filter(item => item.status === statusFilter);
    }
    
    // Sort: all statuses except SOLD first, then SOLD items last
    return [...filtered].sort((a, b) => {
      const aIsSold = a.status === ItemStatus.SOLD;
      const bIsSold = b.status === ItemStatus.SOLD;
      
      // If one is sold and the other isn't, sold goes last
      if (aIsSold && !bIsSold) return 1;
      if (!aIsSold && bIsSold) return -1;
      
      // If both have same sold status, maintain original order (by creation date, newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [items, statusFilter]);

  if (!authStore.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">Please log in to view your items.</p>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground">Loading your items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
            <p className="text-muted-foreground mt-1">Manage your items for sale</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Listing</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
                <DialogDescription>Fill in the details to list your item</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., iPhone 13 Pro"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your item..."
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Campus Village"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as ItemCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ItemCategory.TEXTBOOKS}>Textbooks</SelectItem>
                        <SelectItem value={ItemCategory.ELECTRONICS}>Electronics</SelectItem>
                        <SelectItem value={ItemCategory.FURNITURE}>Furniture</SelectItem>
                        <SelectItem value={ItemCategory.CLOTHING}>Clothing</SelectItem>
                        <SelectItem value={ItemCategory.SPORTS_FITNESS}>Sports & Fitness</SelectItem>
                        <SelectItem value={ItemCategory.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value as ItemCondition })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ItemCondition.NEW}>New</SelectItem>
                        <SelectItem value={ItemCondition.LIKE_NEW}>Like New</SelectItem>
                        <SelectItem value={ItemCondition.GOOD}>Good</SelectItem>
                        <SelectItem value={ItemCondition.FAIR}>Fair</SelectItem>
                        <SelectItem value={ItemCondition.POOR}>Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Item Image (Optional)</Label>
                  <Input id="image" name="image" type="file" accept="image/*" onChange={handleFileChange} />
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-[200px] max-h-[200px] rounded-md border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="mt-2"
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Upload up to 5MB</p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_negotiable"
                      checked={formData.is_negotiable}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    <span className="text-sm">Price is negotiable</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || uploading}>
                    {(createMutation.isPending || uploading) ? (uploading ? "Uploading..." : "Creating...") : "Create Listing"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Filter Buttons */}
        {items && items.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
              className="rounded-full"
            >
              All
            </Button>
            <Button
              variant={statusFilter === ItemStatus.AVAILABLE ? "default" : "outline"}
              onClick={() => setStatusFilter(ItemStatus.AVAILABLE)}
              size="sm"
              className="rounded-full"
            >
              Available
            </Button>
            <Button
              variant={statusFilter === ItemStatus.RESERVED ? "default" : "outline"}
              onClick={() => setStatusFilter(ItemStatus.RESERVED)}
              size="sm"
              className="rounded-full"
            >
              On Hold
            </Button>
            <Button
              variant={statusFilter === ItemStatus.SOLD ? "default" : "outline"}
              onClick={() => setStatusFilter(ItemStatus.SOLD)}
              size="sm"
              className="rounded-full"
            >
              Sold
            </Button>
          </div>
        )}

        {/* Display items */}
        {items && items.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <p className="text-xl text-muted-foreground mb-4">You haven't created any listings yet</p>
            <Button onClick={() => setOpen(true)}>Create Your First Listing</Button>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <p className="text-xl text-muted-foreground mb-4">No items found with the selected filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedItems.map((item) => (
              <MyItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
