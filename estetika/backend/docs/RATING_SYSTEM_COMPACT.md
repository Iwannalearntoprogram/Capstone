# Project Rating System Documentation

## Overview

Client-only rating system for completed projects with 1-5 star ratings and optional comments.

## Business Rules

- **Who**: Only project creators (clients) can rate
- **When**: Only after project status = "completed"
- **How Many**: One rating per project (no updates allowed)
- **Range**: 1-5 stars (integers only) + optional comment (≤500 chars)

## API Endpoints

### GET `/api/rating?projectId={id}&userId={userId}`

Get project ratings

```json
Response: {
  "ratings": [...],
  "statistics": { "averageRating": 4.5, "totalRatings": 12 }
}
```

### GET `/api/rating/stats?projectId={id}`

Get rating statistics with distribution

```json
Response: {
  "statistics": {
    "averageRating": 4.2,
    "totalRatings": 15,
    "distribution": { "5": 8, "4": 4, "3": 2, "2": 1, "1": 0 }
  }
}
```

### POST `/api/rating` (Auth Required)

Submit rating (client only)

```json
Request: {
  "projectId": "project_id",
  "rating": 5,
  "comment": "Excellent work!"
}
Response: {
  "message": "Rating submitted successfully",
  "rating": {...}
}
```

### DELETE `/api/rating?ratingId={id}` (Auth Required)

Delete rating (owner/admin only)

```json
Response: { "message": "Rating deleted successfully" }
```

## Database Schema

### Rating Model

```javascript
{
  project: ObjectId (ref: Project, required),
  user: ObjectId (ref: User, required),
  rating: Number (1-5, integer, required),
  comment: String (max 500 chars, optional),
  timestamps: { createdAt, updatedAt }
}
```

### Project Model (Updated)

```javascript
{
  // ... existing fields
  averageRating: Number (0-5, default: 0),
  totalRatings: Number (default: 0)
}
```

## Validation & Security

### Authorization

- **POST**: Only project creators can rate their completed projects
- **DELETE**: Only rating owner or admin can delete
- **GET**: Public access (no auth required)

### Validation Rules

- Project must exist and be completed
- Rating: 1-5 integers only
- Comment: ≤500 characters
- One rating per project (enforced by DB unique index)

### Error Responses

- `400`: Invalid rating, project not completed, already rated
- `403`: Not authorized (not project creator)
- `404`: Project/rating not found

## Implementation Files

```
backend/
├── models/Project/
│   ├── Rating.js (New model with auto-calculations)
│   └── Project.js (Added rating fields)
├── controllers/Project/
│   └── RatingController.js (CRUD operations)
├── routes/Project/
│   └── ratingRoute.js (API routes)
└── app.js (Route registration)
```

## Key Features

### Automatic Calculations

- Average rating computed via MongoDB aggregation
- Total rating count maintained automatically
- Project statistics updated on rating changes

### Database Optimizations

- Compound unique index: `{ project: 1, user: 1 }`
- Efficient queries with proper population
- Minimal database operations

### Business Logic

- Client-focused rating system
- One-time submission (no updates)
- Completion-gated rating access
- Clean separation of concerns

## Usage Examples

### Frontend Integration

```javascript
// Submit rating
const response = await fetch("/api/rating", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    projectId: "project_id",
    rating: 5,
    comment: "Outstanding work!",
  }),
});

// Get ratings
const ratings = await fetch(`/api/rating?projectId=${projectId}`);

// Get statistics
const stats = await fetch(`/api/rating/stats?projectId=${projectId}`);
```

### React Component Example

```jsx
const ProjectRating = ({ project, user }) => {
  const canRate =
    user.id === project.projectCreator._id &&
    project.status === "completed" &&
    !project.userHasRated;

  return (
    <div>
      <StarDisplay rating={project.averageRating} />
      <span>({project.totalRatings} ratings)</span>
      {canRate && <RatingForm projectId={project._id} />}
    </div>
  );
};
```

## Testing Scenarios

### Valid Cases

- Client rates completed project (should succeed)
- Get ratings for any project (should succeed)
- Admin deletes any rating (should succeed)

### Invalid Cases

- Rate incomplete project (400 error)
- Non-client tries to rate (403 error)
- Rate same project twice (400 error)
- Update existing rating (400 error)

## Performance Considerations

- Indexed queries for fast lookups
- Aggregation pipelines for statistics
- Automatic background calculations
- Minimal API surface area

This rating system provides authentic client feedback while maintaining data integrity and system performance.
