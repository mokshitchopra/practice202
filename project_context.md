# Project Enhancement Context: Campus Marketplace UI Overhaul

This document serves as a comprehensive context guide for applying recent enhancements to the original organization repository. It details every major feature implementation, design change, and bug fix executed in the practice environment.

## 1. Core Objective
**Goal**: Transform the basic marketplace UI into a premium, "Airbnb-style" application with a focus on minimalism, visual appeal, and smooth user experience.

## 2. Key Features Implemented

### A. Image Cropping & Uploads
**Files Created/Modified**:
- `frontend/src/components/ImageCropper.tsx`: New component using `react-easy-crop`.
- `frontend/src/components/ui/slider.tsx`: Zoom control for the cropper.
- `frontend/src/lib/utils.ts`: Added `getCroppedImg` utility function (canvas-based).
- `frontend/src/pages/CreateItem.tsx` & `MyItems.tsx`: Integrated the cropper into the upload flow.

**Implementation Logic**:
- Intercepts file input change.
- Opens a dialog with the selected image.
- Enforces a **4:3 aspect ratio** crop.
- Returns a `Blob` which is then uploaded to the backend.

### B. Skeleton Loading States
**Files Created/Modified**:
- `frontend/src/components/ui/skeleton.tsx`: Base shimmering component.
- `frontend/src/components/skeletons/ListingCardSkeleton.tsx`: Mimics the listing card layout.
- `frontend/src/pages/Home.tsx` & `MyItems.tsx`: Replaced text-based "Loading..." with these skeletons.

**Implementation Logic**:
- Conditional rendering based on `isLoading` state from React Query.
- Maintains layout stability (prevents layout shift) during data fetching.

### C. Empty State Components
**Files Created/Modified**:
- `frontend/src/components/EmptyState.tsx`: Reusable component with icon, title, description, and action button.
- `frontend/src/pages/Home.tsx` & `MyItems.tsx`: Integrated for "No results found" and "No listings" scenarios.

### D. Item Detail Page Redesign (Airbnb Style)
**Files Created/Modified**:
- `frontend/src/pages/ItemDetail.tsx`: Complete rewrite.
- `frontend/src/components/ui/separator.tsx`: Added for visual division.

**Design Details**:
- **Split Layout**:
    - **Left (66%)**: Large Hero Image (aspect 4:3), Title, Tags, Description, Seller Info.
    - **Right (33%)**: Sticky "Action Card" with Price, Status, and Contact/Edit buttons.
- **Lightbox**: Integrated `ImageLightbox` for full-screen viewing.
- **Typography**: Used `Plus Jakarta Sans` for a modern feel.

### E. Home Screen & Global Polish
**Files Created/Modified**:
- `frontend/src/pages/Home.tsx`:
    - **Hero Search**: Large, centered, pill-shaped search bar with shadow.
    - **Category Strip**: Horizontal scrollable list of icons instead of a dropdown.
    - **Listing Grid**: Standardized card heights and image ratios.
- `frontend/src/index.css`:
    - Added CSS variables for "Airbnb-style" shadows (`--shadow-elegant`).
    - Added animations: `@keyframes fadeIn`, `@keyframes scaleIn`, `@keyframes slideUp`.
    - Added utility classes: `.hover-lift`, `.click-scale`.

## 3. Critical Bug Fixes

### A. Search Input Focus Loss
**Issue**: Typing in the search bar caused the input to lose focus after every character.
**Cause**: The `isLoading` state from React Query was triggering a full re-render of the component tree, unmounting the search input and replacing it with skeletons.
**Fix**: Refactored `Home.tsx` to keep the `Navbar` and `Search Section` **always mounted**. Only the *results grid* is conditionally swapped with skeletons.

### B. Localhost Connectivity (IPv6 vs IPv4)
**Issue**: Frontend (`localhost:8080`) couldn't talk to Backend (`localhost:8000`), getting "Connection Refused".
**Cause**: `localhost` resolved to IPv6 (`::1`) on Mac, but backend listened on IPv4 (`127.0.0.1`).
**Fix**: Hardcoded `API_BASE_URL` in `frontend/src/lib/api.ts` to `http://127.0.0.1:8000`.

### C. Image Aspect Ratio
**Issue**: Images were `aspect-square` (1:1), cutting off content.
**Fix**: Changed to `aspect-[4/3]` in `ListingCard.tsx` and enforced this ratio in the `ImageCropper`.

## 4. Dependencies Added
- `react-easy-crop`: For image manipulation.
- `@radix-ui/react-slider`: For the zoom slider.
- `lucide-react`: Additional icons used in Empty States and Categories.

## 5. How to Apply to New Repo
1.  **Copy Components**: Move the new files from `src/components` (ImageCropper, EmptyState, Skeletons) to the new repo.
2.  **Update Pages**: Replace the content of `Home.tsx`, `ItemDetail.tsx`, `CreateItem.tsx`, and `MyItems.tsx` with the updated code.
3.  **Update Styles**: Copy the contents of `index.css`.
4.  **Install Deps**: Run `npm install react-easy-crop @radix-ui/react-slider`.
