import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Settings, AlertTriangle } from "lucide-react";
import { getItem, updateItem, deleteItem, uploadFile } from "@/lib/api";
import { authStore } from "@/store/authStore";
import ImageLightbox from "@/components/ImageLightbox";
import { addToRecentlyViewed, formatCategory, formatCondition } from "@/lib/utils";
import { Item, ItemCategory, ItemCondition, ItemStatus, UserRole } from "@/types";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const itemId = id ? parseInt(id) : 0;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>(ItemStatus.AVAILABLE);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
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

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => getItem(itemId),
    enabled: !!itemId,
  });

  useEffect(() => {
    if (item) {
      addToRecentlyViewed(item.id);
    }
  }, [item]);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        condition: item.condition,
        location: item.location || "",
        is_negotiable: item.is_negotiable,
      });
      setImagePreview(item.item_url || null);
      setSelectedStatus(item.status);
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) => updateItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      toast.success("Listing updated successfully!");
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update listing");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: number; status: ItemStatus }) =>
      updateItem(itemId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", itemId] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      toast.success("Status updated successfully!");
      setStatusDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      toast.success("Listing deleted successfully!");
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
      navigate("/my-items");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete listing");
    },
  });

  const resetForm = () => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        condition: item.condition,
        location: item.location || "",
        is_negotiable: item.is_negotiable,
      });
      setImagePreview(item.item_url || null);
    }
    setSelectedFile(null);
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!formData.title || !formData.description || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    let imageUrl: string | undefined = item.item_url;

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

    updateMutation.mutate({
      itemId: item.id,
      data: {
        title: formData.title,
        description: formData.description,
        price: price,
        condition: formData.condition,
        category: formData.category,
        location: formData.location || undefined,
        is_negotiable: formData.is_negotiable,
        item_url: imageUrl,
      },
    });
  };

  const handleStatusSubmit = () => {
    if (!item) return;
    statusMutation.mutate({ itemId: item.id, status: selectedStatus });
  };

  const handleDeleteConfirm = () => {
    if (!item) return;
    if (deleteConfirmText !== item.title) {
      toast.error("Listing name does not match. Please enter the exact name.");
      return;
    }
    deleteMutation.mutate(item.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-px w-full my-8" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-destructive mb-4">
            Error loading item: {error instanceof Error ? error.message : "Item not found"}
          </p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if current user is the owner
  const isOwner = authStore.user && item.seller_id === authStore.user.user_id;
  const isAdmin = authStore.user?.role === UserRole.ADMIN;
  const canEdit = isOwner || isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb / Back Button */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            ← Back to listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Image & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-muted/10 aspect-[4/3] relative group">
              {item.item_url ? (
                <>
                  <img
                    src={item.item_url}
                    alt={item.title}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500 ease-out"
                    onClick={() => setLightboxOpen(true)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => setLightboxOpen(true)}
                  >
                    View Fullscreen
                  </Button>
                  <ImageLightbox
                    imageUrl={item.item_url}
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                    <span className="text-2xl">📷</span>
                  </div>
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Title & Basic Info */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{item.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{item.location || "Campus Pickup"}</span>
                    <span>•</span>
                    <span>{format(new Date(item.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                {/* Share/Save buttons could go here */}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="px-3 py-1 text-sm font-normal">
                  {formatCategory(item.category)}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm font-normal">
                  {formatCondition(item.condition)}
                </Badge>
                {item.is_negotiable && (
                  <Badge variant="outline" className="px-3 py-1 text-sm font-normal border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
                    Negotiable
                  </Badge>
                )}
              </div>

              <Separator className="my-8" />

              {/* Description */}
              <div>
                <h3 className="text-xl font-semibold mb-4">About this item</h3>
                <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed text-lg">
                  {item.description}
                </p>
              </div>

              <Separator className="my-8" />

              {/* Seller Info Placeholder */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Seller Information</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    S
                  </div>
                  <div>
                    <p className="font-medium">Spartan Seller</p>
                    <p className="text-sm text-muted-foreground">Joined in 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-elegant border-border/40 overflow-hidden">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <div className="text-3xl font-bold text-foreground">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <Badge variant={item.status === "available" ? "default" : "secondary"} className="mb-1">
                      {item.status === "available" ? "Available" : item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {canEdit ? (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-11"
                        onClick={() => setStatusDialogOpen(true)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Modify Status
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-11"
                        onClick={() => setEditDialogOpen(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Listing
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start h-11"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Listing
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {authStore.isAuthenticated ? (
                        <Button className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-all" size="lg">
                          Contact Seller
                        </Button>
                      ) : (
                        <div className="text-center space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Log in to contact the seller and make an offer.
                          </p>
                          <Link to="/login" className="block">
                            <Button className="w-full h-11">Log in to Contact</Button>
                          </Link>
                        </div>
                      )}
                      <p className="text-xs text-center text-muted-foreground">
                        Safety Tip: Meet in a public place on campus.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Status</DialogTitle>
            <DialogDescription>
              Change the status of "{item.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as ItemStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ItemStatus.AVAILABLE}>Available</SelectItem>
                  <SelectItem value={ItemStatus.RESERVED}>On Hold</SelectItem>
                  <SelectItem value={ItemStatus.SOLD}>Sold</SelectItem>
                  <SelectItem value={ItemStatus.INACTIVE}>Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: Archived items are hidden from public view but remain visible to you and admins.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusSubmit} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>Update the details of your listing</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location (Optional)</Label>
                <Input
                  id="edit-location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
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
                <Label htmlFor="edit-condition">Condition</Label>
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
              <Label htmlFor="edit-image">Item Image (Optional)</Label>
              <Input id="edit-image" name="image" type="file" accept="image/*" onChange={handleFileChange} />
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
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm">Price is negotiable</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || uploading}>
                {(updateMutation.isPending || uploading) ? (uploading ? "Uploading..." : "Saving...") : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Listing
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing "{item.title}".
              <br />
              <br />
              <strong>To confirm, please type the listing name:</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder={item.title}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== item.title || deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
