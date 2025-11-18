import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItem } from "@/lib/api";
import { authStore } from "@/store/authStore";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const itemId = id ? parseInt(id) : 0;

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => getItem(itemId),
    enabled: !!itemId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground">Loading item...</p>
        </div>
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

  const isOwner = authStore.user && item.seller_id === authStore.user.user_id.toString();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            ← Back to listings
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {item.item_url ? (
              <img
                src={item.item_url}
                alt={item.title}
                className="w-full rounded-lg border border-border"
              />
            ) : (
              <div className="w-full aspect-square bg-muted rounded-lg border border-border flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{item.title}</h1>
            <div className="text-3xl font-bold text-primary mb-6">${item.price.toFixed(2)}</div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <Badge variant={item.status === "available" ? "default" : "secondary"}>
                  {item.status}
                </Badge>
              </div>

              <div>
                <span className="font-semibold">Category:</span>{" "}
                {item.category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>

              <div>
                <span className="font-semibold">Condition:</span>{" "}
                {item.condition.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>

              {item.location && (
                <div>
                  <span className="font-semibold">Location:</span> {item.location}
                </div>
              )}

              <div>
                <span className="font-semibold">Negotiable:</span> {item.is_negotiable ? "Yes" : "No"}
              </div>

              <div className="text-sm text-muted-foreground">
                <span className="font-semibold">Listed:</span> {format(new Date(item.created_at), "MMM d, yyyy")}
              </div>
            </div>

            {isOwner && (
              <Card className="mb-6 bg-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Your Listing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This is your listing. You can edit it from your "My Items" page.
                  </p>
                </CardContent>
              </Card>
            )}

            {!isOwner && authStore.isAuthenticated && (
              <Button className="w-full" size="lg">
                Contact Seller
              </Button>
            )}

            {!authStore.isAuthenticated && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Want to contact the seller?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please log in to contact the seller about this item.
                  </p>
                  <Link to="/login">
                    <Button>Login</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{item.description}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
