import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce function for input delays
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Theme management
export const getTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const setTheme = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Recently viewed items
export const getRecentlyViewed = (): number[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('recentlyViewed');
  return stored ? JSON.parse(stored) : [];
};

export const addToRecentlyViewed = (itemId: number) => {
  if (typeof window === 'undefined') return;
  const recent = getRecentlyViewed();
  const filtered = recent.filter(id => id !== itemId);
  const updated = [itemId, ...filtered].slice(0, 20); // Keep last 20
  localStorage.setItem('recentlyViewed', JSON.stringify(updated));
};

export const removeFromRecentlyViewed = (itemId: number) => {
  if (typeof window === 'undefined') return;
  const recent = getRecentlyViewed();
  const updated = recent.filter(id => id !== itemId);
  localStorage.setItem('recentlyViewed', JSON.stringify(updated));
};

export const clearRecentlyViewed = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('recentlyViewed');
};

export const isRecentlyViewedDismissed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('recentlyViewedDismissed') === 'true';
};

export const setRecentlyViewedDismissed = (dismissed: boolean) => {
  if (typeof window === 'undefined') return;
  if (dismissed) {
    localStorage.setItem('recentlyViewedDismissed', 'true');
  } else {
    localStorage.removeItem('recentlyViewedDismissed');
  }
};

// Favorites management
export const getFavorites = (): number[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('favorites');
  return stored ? JSON.parse(stored) : [];
};

export const toggleFavorite = (itemId: number): boolean => {
  if (typeof window === 'undefined') return false;
  const favorites = getFavorites();
  const isFavorite = favorites.includes(itemId);
  if (isFavorite) {
    const updated = favorites.filter(id => id !== itemId);
    localStorage.setItem('favorites', JSON.stringify(updated));
    return false;
  } else {
    favorites.push(itemId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    return true;
  }
};

export const isFavorite = (itemId: number): boolean => {
  return getFavorites().includes(itemId);
};

// Comparison management
export const getComparison = (): number[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('comparison');
  return stored ? JSON.parse(stored) : [];
};

export const addToComparison = (itemId: number): boolean => {
  if (typeof window === 'undefined') return false;
  const comparison = getComparison();
  if (comparison.includes(itemId)) return false;
  if (comparison.length >= 3) return false; // Max 3 items
  comparison.push(itemId);
  localStorage.setItem('comparison', JSON.stringify(comparison));
  return true;
};

export const toggleComparison = (itemId: number): boolean => {
  if (typeof window === 'undefined') return false;
  const comparison = getComparison();
  const isInComparison = comparison.includes(itemId);
  if (isInComparison) {
    removeFromComparison(itemId);
    return false;
  } else {
    if (comparison.length >= 3) return false; // Max 3 items
    comparison.push(itemId);
    localStorage.setItem('comparison', JSON.stringify(comparison));
    return true;
  }
};

export const removeFromComparison = (itemId: number) => {
  if (typeof window === 'undefined') return;
  const comparison = getComparison();
  const updated = comparison.filter(id => id !== itemId);
  localStorage.setItem('comparison', JSON.stringify(updated));
};

export const clearComparison = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('comparison');
};

// Search history
export const getSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('searchHistory');
  return stored ? JSON.parse(stored) : [];
};

export const addToSearchHistory = (query: string) => {
  if (typeof window === 'undefined' || !query.trim()) return;
  const history = getSearchHistory();
  const filtered = history.filter(q => q.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...filtered].slice(0, 10); // Keep last 10
  localStorage.setItem('searchHistory', JSON.stringify(updated));
};

export const clearSearchHistory = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('searchHistory');
};

// Formatting utilities for display
export const formatCategory = (category: string): string => {
  // Replace underscores with spaces and convert to title case
  return category
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatCondition = (condition: string): string => {
  // Replace underscores with spaces and convert to title case
  return condition
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatStatus = (status: string): string => {
  // Convert to title case
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};


export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, "image/jpeg");
  });
}

export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
