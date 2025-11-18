import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Item } from "@/types";
import { format } from "date-fns";

interface ListingCardProps {
  id: number;
  title: string;
  price: number;
  condition: string;
  category: string;
  location?: string;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
}

const ListingCard = ({ title, price, condition, category, location, imageUrl, id }: ListingCardProps) => {
  return (
    <Link to={`/items/${id}`} className="block">
      <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group border-border/50">
        <div className="aspect-square bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate text-card-foreground">{title}</h3>
          <p className="text-2xl font-bold text-primary mt-1">${price.toFixed(2)}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {category.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {condition.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
        {location && (
          <CardFooter className="px-4 pb-4 pt-0">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              {location}
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};

export default ListingCard;

