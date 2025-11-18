import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createItem, uploadFile } from "@/lib/api";
import { ItemCategory, ItemCondition } from "@/types";
import { authStore } from "@/store/authStore";
import { Link } from "react-router-dom";

export default function CreateItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: ItemCondition.GOOD,
    category: ItemCategory.OTHER,
    location: "",
    is_negotiable: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      toast.success("Listing created successfully!");
      navigate("/my-items");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create listing");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (name === "price") {
      setFormData({ ...formData, [name]: value });
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

    mutation.mutate({
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

  if (!authStore.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">Please log in to create a listing.</p>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Create New Listing</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as ItemCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label htmlFor="condition">Condition *</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value as ItemCondition })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., San Jose State University"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Item Image (optional)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
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
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_negotiable"
                    checked={formData.is_negotiable}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm">Price is negotiable</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending || uploading}
                  className="flex-1"
                >
                  {(mutation.isPending || uploading) ? (uploading ? "Uploading..." : "Creating...") : "Create Listing"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
