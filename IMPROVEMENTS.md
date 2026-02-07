# TripLink Improvements Plan

## Ready to Implement (say "next" to apply each one)

### 1. Trip Duplication
- **File:** `src/stores/tripStore.ts` - add `duplicateTrip` method ✅ DONE
- **File:** `src/components/TripDetail/TripDetail.tsx` - add Duplicate button

### 2. Notes per City
- **File:** `prisma/schema.prisma` - add `notes` field to City model
- **File:** `src/types/index.ts` - add notes to City type
- **File:** `src/components/CreateTrip/CreateTripModal.tsx` - add notes input
- **File:** `src/components/TripDetail/TripDetail.tsx` - show notes
- **File:** `src/app/api/trips/route.ts` - handle notes in create
- **File:** `src/app/api/trips/[id]/route.ts` - handle notes in update

### 3. Fit All Trips on Map
- **File:** `src/components/Map/TripMap.tsx` - add fitAll button

### 4. Distance/Time Estimates
- **File:** `src/lib/geo.ts` - add distance calculation
- **File:** `src/components/TripDetail/TripDetail.tsx` - show distances

### 5. Trip Comments
- **File:** `prisma/schema.prisma` - add Comment model
- **File:** `src/types/index.ts` - add Comment type
- **File:** `src/app/api/trips/[id]/comments/route.ts` - CRUD
- **File:** `src/components/TripDetail/Comments.tsx` - new component
- **File:** `src/components/TripDetail/TripDetail.tsx` - add comments section

### 6. Calendar Export
- **File:** `src/lib/ical.ts` - generate .ics file
- **File:** `src/app/api/trips/[id]/export/route.ts` - export endpoint
- **File:** `src/components/TripDetail/TripDetail.tsx` - add export button

### 7. City Photos (Unsplash)
- **File:** `src/app/api/cities/photo/route.ts` - fetch from Unsplash
- **File:** `src/components/TripDetail/TripDetail.tsx` - show photos

### 8. Drag to Reorder Cities
- **File:** `package.json` - add @dnd-kit/core
- **File:** `src/components/CreateTrip/CreateTripModal.tsx` - add drag handles

### 9. Activity Log
- **File:** `prisma/schema.prisma` - add Activity model
- **File:** `src/app/api/trips/[id]/activity/route.ts` - log endpoint
- **File:** `src/components/TripDetail/ActivityLog.tsx` - new component

### 10. Share as Image
- **File:** `src/lib/shareImage.ts` - generate canvas image
- **File:** `src/components/TripDetail/TripDetail.tsx` - add share button

---

## Current Progress
- [x] 1a. duplicateTrip store method added
- [ ] 1b. Duplicate button in TripDetail

Say **"next"** to apply the next change.
