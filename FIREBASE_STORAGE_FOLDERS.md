# Firebase Storage Folder Structure

## Required Storage Folders

The admin panel expects files to be organized in the following Firebase Storage folders, matching the document categories:

### Current Folders (from your Firebase Storage):
- `band-assistance/` - Maps to "Social Assistance" or "Income Assistance"
- `elder-support/` - Maps to "Elder Care"
- `housing/` - Maps to "Housing"
- `income-assistance/` - Maps to "Income Assistance"

### Required Additional Folders:

You need to create these folders in Firebase Storage to match all admin categories:

1. **`education/`** - For "Education" category documents
2. **`jordans-principle/`** - For "Jordan's Principle" category documents
3. **`social-assistance/`** - For "Social Assistance" category documents (if different from band-assistance)
4. **`status-cards/`** - For "Status Cards" category documents
5. **`other/`** - For "Other" category documents

## Category to Storage Folder Mapping

| Admin Category | Storage Folder Name | Notes |
|---------------|---------------------|-------|
| Education | `education/` | **Needs to be created** |
| Elder Care | `elder-support/` | Already exists |
| Housing | `housing/` | Already exists |
| Income Assistance | `income-assistance/` | Already exists |
| Jordan's Principle | `jordans-principle/` | **Needs to be created** |
| Social Assistance | `social-assistance/` or `band-assistance/` | **Needs to be created** (or clarify if band-assistance is used) |
| Status Cards | `status-cards/` | **Needs to be created** |
| Other | `other/` | **Needs to be created** |

## How to Create Folders in Firebase Storage

1. Go to Firebase Console → Storage
2. Click "Get Started" or navigate to your bucket
3. Click "Upload file" or create folders by uploading a placeholder file
4. Create the following folder structure:
   ```
   education/
   jordans-principle/
   social-assistance/  (or use band-assistance if that's the same)
   status-cards/
   other/
   ```

## File Path Format

When the main app uploads files, they should be stored with paths like:
- `education/filename.pdf`
- `elder-support/filename.pdf`
- `housing/filename.pdf`
- `income-assistance/filename.pdf`
- `jordans-principle/filename.pdf`
- `social-assistance/filename.pdf` (or `band-assistance/filename.pdf`)
- `status-cards/filename.pdf`
- `other/filename.pdf`

## Important Notes

1. **Folder names are case-sensitive** - Use lowercase with hyphens as shown
2. **Files should include the category folder in their path** - The admin panel will look for files in these folders based on the document's category
3. **If you're using `band-assistance` for Social Assistance**, you may want to rename it to `social-assistance` for consistency, or update the mapping in the admin panel

