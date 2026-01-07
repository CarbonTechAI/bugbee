# /api/todos Query Parameters

## Overview
The `/api/todos` GET endpoint now supports comprehensive filtering, searching, sorting, and pagination through query parameters.

## Query Parameters

### Filtering

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `archived` | boolean | `false` | Filter by archived status |
| `status` | string | `all` | Filter by completion status: `open`, `completed`, or `all` |
| `showCompleted` | boolean | `false` | When `false` and `status=all`, hides completed todos |
| `typeId` | uuid | - | Filter by specific todo type ID |
| `q` | string | - | Search query (searches title and notes) |

### Sorting

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sort` | string | `newest` | Sort order: `newest`, `oldest`, or `updated` |

### Pagination

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | `200` | Maximum number of results to return |
| `offset` | number | `0` | Number of results to skip (for offset-based pagination) |
| `cursor` | string | - | Timestamp cursor for cursor-based pagination (uses created_at) |

## Examples

### Basic Usage (Current UI)
```bash
GET /api/todos
# Returns: All non-archived, non-completed todos, sorted by newest, limit 200
```

### Search for todos
```bash
GET /api/todos?q=bug+fix
# Returns: Todos with "bug fix" in title or notes
```

### Filter by type
```bash
GET /api/todos?typeId=123e4567-e89b-12d3-a456-426614174000
# Returns: Todos of a specific type
```

### Show only completed todos
```bash
GET /api/todos?status=completed
# Returns: Only completed todos
```

### Show all including completed
```bash
GET /api/todos?showCompleted=true
# Returns: All todos (open and completed)
```

### Sort by recently updated
```bash
GET /api/todos?sort=updated
# Returns: Todos sorted by last updated (most recent first)
```

### Pagination - Offset-based
```bash
GET /api/todos?limit=50&offset=0   # First page
GET /api/todos?limit=50&offset=50  # Second page
GET /api/todos?limit=50&offset=100 # Third page
```

### Pagination - Cursor-based
```bash
GET /api/todos?limit=50
# Returns: {todos}, note the created_at of last item

GET /api/todos?limit=50&cursor=2024-01-07T10:00:00Z
# Returns: Next 50 todos created before the cursor timestamp
```

### Combined Filters
```bash
GET /api/todos?q=feature&typeId=abc&status=open&sort=updated&limit=20
# Returns: Open todos of type 'abc' containing "feature", sorted by update time, max 20 results
```

## Response Format

```json
[
  {
    "id": "uuid",
    "title": "string",
    "notes": "string | null",
    "priority": "low | medium | high | null",
    "is_completed": "boolean",
    "completed_at": "timestamp | null",
    "completed_by_name": "string | null",
    "created_at": "timestamp",
    "created_by_name": "string",
    "updated_at": "timestamp",
    "updated_by_name": "string",
    "archived": "boolean",
    "type_id": "uuid | null",
    "type": {
      "id": "uuid",
      "name": "string"
    } | null,
    "last_activity_at": "timestamp",
    "last_activity_by": "string"
  }
]
```

## Backward Compatibility

The current To-Do UI calls `/api/todos` without any query parameters and will continue to work with the following defaults:
- Returns non-archived todos (`archived=false`)
- Hides completed todos by default (`status=all`, `showCompleted=false`)
- Sorted by newest created (`sort=newest`)
- Limit of 200 results (`limit=200`)
- Client-side filtering for search, type, and status is maintained

## Implementation Notes

1. **Search (`q`)**: Applied on the server after fetching, searches both title and notes fields (case-insensitive)
2. **Type filtering (`typeId`)**: Applied at database level for efficiency
3. **Status filtering**: Applied at database level using `is_completed` field
4. **Sorting**:
   - `newest`: `ORDER BY created_at DESC`
   - `oldest`: `ORDER BY created_at ASC`
   - `updated`: `ORDER BY updated_at DESC`
5. **Pagination**: Supports both offset-based (simpler) and cursor-based (better for large datasets)
6. **Activity enrichment**: Still fetches activity log data and enriches todos with `last_activity_at` and `last_activity_by`
