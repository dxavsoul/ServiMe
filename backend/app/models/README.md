# Models Refactoring Migration Guide

## Overview
This guide explains how to migrate from the monolithic `models.py` file to the new organized models structure.

## New Structure

```
app/models/
├── __init__.py          # Main models module with all exports
├── base.py             # Base models and common utilities
├── auth.py             # Authentication and security models
├── user.py             # User-related models
├── item.py             # Item-related models
├── company.py          # Company-related models
├── branch.py           # Branch-related models
└── branch_user.py      # Branch-User relationship models
```

## Benefits

1. **Separation of Concerns**: Each file focuses on a specific domain
2. **Better Maintainability**: Easier to find and modify specific models
3. **Reduced File Size**: No more 279-line monolithic file
4. **Clear Dependencies**: Easy to understand model relationships
5. **Improved Documentation**: Each module has specific docstrings
6. **Team Collaboration**: Reduced merge conflicts when multiple developers work on different models

## Migration Steps

### Step 1: Update Import Statements

**Before (Old imports):**
```python
from app.models import User, Company, Branch, Item
```

**After (New imports - Option 1: Same as before):**
```python
from app.models import User, Company, Branch, Item
```

**After (New imports - Option 2: Specific imports):**
```python
from app.models.user import User, UserCreate, UserPublic
from app.models.company import Company, CompanyCreate
from app.models.branch import Branch, BranchPublic
```

### Step 2: Verify All Imports Still Work

The new `__init__.py` file exports all models, so existing imports should continue to work without changes.

### Step 3: Remove Old models.py File

Once you've verified everything works correctly, you can remove the old `models.py` file.

## File Descriptions

### `base.py`
- Contains shared base classes and utilities
- Common response models like `Message` and `BasePublicList`

### `auth.py`
- Authentication and security-related models
- Token, password reset, and JWT payload models

### `user.py`
- All user-related models and schemas
- User creation, updates, and public responses

### `item.py`
- Item-related models and schemas
- Basic CRUD models for items

### `company.py`
- Company-related models and schemas
- Company management and API responses

### `branch.py`
- Branch-related models and schemas
- Branch management with company relationships

### `branch_user.py`
- Branch-User association models
- User assignments to branches and role management

## Best Practices for Future Development

1. **Follow the Pattern**: When adding new models, create new files following the same structure
2. **Update __init__.py**: Always export new models in the main `__init__.py` file
3. **Use Forward References**: Use string quotes for forward references to avoid circular imports
4. **Document New Models**: Add clear docstrings explaining the purpose of each model
5. **Group Related Models**: Keep related models in the same file (e.g., Base, Create, Update, Public)

## Testing the Migration

1. Run your test suite to ensure all imports work correctly
2. Check that all API endpoints still function properly
3. Verify database operations continue to work
4. Test CRUD operations for all models

## Rollback Plan

If issues arise, you can quickly rollback by:
1. Keeping a backup of the original `models.py` file
2. Removing the new `models/` directory
3. Restoring the original file

## Future Enhancements

Consider these improvements for the future:
1. Add model factories for testing
2. Create base CRUD classes
3. Add model validation helpers
4. Implement model serialization utilities
