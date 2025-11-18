import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, IdCard, Upload, Edit2, Save, X, DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getProfile, updateProfile, getMyItems, uploadFile } from "@/lib/api";
import { authStore } from "@/store/authStore";
import { ItemStatus } from "@/types";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ full_name: "", phone: "" });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: authStore.isAuthenticated,
  });

  const { data: items } = useQuery({
    queryKey: ["myItems"],
    queryFn: getMyItems,
    enabled: authStore.isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  // Calculate stats from items
  const stats = items
    ? {
        totalListings: items.length,
        soldItems: items.filter((item) => item.status === ItemStatus.SOLD).length,
        amountEarned: items
          .filter((item) => item.status === ItemStatus.SOLD)
          .reduce((sum, item) => sum + item.price, 0),
        // Placeholder for purchases (not tracked yet)
        purchases: 0,
        amountSpent: 0,
      }
    : {
        totalListings: 0,
        soldItems: 0,
        amountEarned: 0,
        purchases: 0,
        amountSpent: 0,
      };

  if (!authStore.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">Please log in to view your profile.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-destructive">Error loading profile</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditedData({
      full_name: user.full_name,
      phone: user.phone || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ full_name: "", phone: "" });
  };

  const handleSave = () => {
    updateMutation.mutate(editedData);
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload profile picture
      try {
        const imageUrl = await uploadFile(file, "profile");
        toast.success("Profile picture updated!");
        // Note: Backend would need to store this in user profile
        setProfilePicturePreview(imageUrl);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload profile picture");
      }
    }
  };

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Picture Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center space-x-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profilePicturePreview || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    id="profile-picture-input"
                  />
                  <Button asChild className="flex items-center space-x-2">
                    <label htmlFor="profile-picture-input" className="cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Upload New Picture</span>
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF (max. 5MB)</p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEdit} className="flex items-center space-x-2">
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCancel} className="flex items-center space-x-2">
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>{updateMutation.isPending ? "Saving..." : "Save"}</span>
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={editedData.full_name}
                        onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{user.full_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <IdCard className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{user.student_id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedData.phone}
                        onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                        className="mt-1"
                        placeholder="Phone number"
                      />
                    ) : (
                      <p className="font-medium mt-1">{user.phone || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Statistics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Your marketplace activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Listings</p>
                      <p className="text-2xl font-bold">{stats.totalListings}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sold Items</p>
                      <p className="text-2xl font-bold">{stats.soldItems}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Earned</p>
                      <p className="text-2xl font-bold">${stats.amountEarned.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Purchases</p>
                      <p className="text-2xl font-bold">{stats.purchases}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Spent</p>
                      <p className="text-2xl font-bold">${stats.amountSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

