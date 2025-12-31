# Resource Structure Guide

## Understanding Resources and Resource Content

Resources are organized in a hierarchical structure:

### Resources (Parent)
Resources are the main categories/containers. Each resource has:
- A **name** (e.g., "Social Development", "Education", "Chief & Council")
- A **subCategory** (one of the predefined categories like "Social Development", "Education", etc.)
- Optional description and contact information

### Resource Content (Children)
Resource Content items are the actual posts/articles that belong to a resource. Each content item has:
- A **title**
- **content** (the main text)
- Optional **description**
- Linked to a parent resource via `resourceId`

## Example Structure

### ✅ Correct Structure:
```
Resource: "Social Development"
  ├─ SubCategory: "Social Development"
  ├─ Resource Content: "Community Outreach"
  ├─ Resource Content: "Youth Programs"
  └─ Resource Content: "Elder Support Services"
```

### ❌ Incorrect Structure:
```
Resource: "Community Outreach"  ← Should NOT be a separate resource
Resource: "Social Development"
```

## How to Use

1. **Create a Resource** with subCategory "Social Development"
2. **Add Resource Content** items to that resource (like "Community Outreach", "Youth Programs", etc.)
3. The main app will display the resource and show all content items nested within it

## Important Notes

- **"Community Outreach"** should be a **Resource Content item** within a **"Social Development" resource**, not its own resource
- Each resource can have multiple content items
- Content items are what users see when they click on a resource in the main app

