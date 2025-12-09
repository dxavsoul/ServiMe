# CRUD Module Refactoring

This document explains the new modular CRUD structure that replaces the monolithic `crud.py` file.

## 📁 New File Structure

```
app/crud/
├── __init__.py              # Main exports and backward compatibility
├── base.py                  # Base CRUD class with common operations
├── crud_user.py            # User-specific CRUD operations
├── crud_item.py            # Item-specific CRUD operations  
├── crud_company.py         # Company-specific CRUD operations
├── crud_branch.py          # Branch-specific CRUD operations
├── crud_branch_user.py     # Branch-User relationship CRUD operations
└── legacy_functions.py     # Backward compatibility functions
```

## 🔄 Migration Guide

### Old Way (Deprecated but still works)
```python
from app import crud

# Create user
user = crud.create_user(session=session, user_create=user_data)

# Get company
company = crud.get_company_by_id(session=session, company_id=company_id)

# Assign user to branch
assignment = crud.assign_user_to_branch(
    session=session, 
    branch_id=branch_id, 
    user_id=user_id, 
    role="employee",
    assigned_by=current_user.id
)
```

### New Way (Recommended)
```python
from app.crud import user, company, branch_user

# Create user
new_user = user.create(session=session, obj_in=user_data)

# Get company
company_obj = company.get(session=session, id=company_id)

# Assign user to branch
assignment = branch_user.assign_user_to_branch(
    session=session, 
    branch_id=branch_id, 
    user_id=user_id, 
    role="employee",
    assigned_by=current_user.id
)
```

## 🎯 Benefits

### 1. **Separation of Concerns**
Each entity (User, Company, Branch, etc.) has its own dedicated CRUD class with specific methods.

### 2. **Type Safety**
```python
from app.crud import user, company

# IDE will provide proper autocomplete and type hints
users_list, total = user.get_multi(session=session, skip=0, limit=10)
active_companies, count = company.get_active(session=session)
```

### 3. **Consistency**
All CRUD classes inherit from `CRUDBase` ensuring consistent interface:
- `get(session, id)` - Get single record
- `get_multi(session, skip, limit)` - Get multiple records with pagination
- `create(session, obj_in, **kwargs)` - Create new record
- `update(session, db_obj, obj_in)` - Update existing record
- `remove(session, id)` - Delete record

### 4. **Extensibility**
Easy to add entity-specific methods:

```python
# User-specific methods
user.get_by_email(session=session, email="user@example.com")
user.authenticate(session=session, email="user@example.com", password="secret")
user.is_active(user_obj)
user.is_superuser(user_obj)

# Company-specific methods
company.get_by_owner(session=session, owner_id=user_id)
company.get_active(session=session)

# Branch-specific methods
branch.get_by_company(session=session, company_id=company_id)
branch.get_by_owner(session=session, owner_id=user_id)
branch.get_accessible_by_user(session=session, accessible_branch_ids=branch_ids)

# Branch-User relationship methods
branch_user.assign_user_to_branch(...)
branch_user.remove_user_from_branch(...)
branch_user.get_branch_users(...)
branch_user.get_user_branches(...)
branch_user.user_has_branch_access(...)
```

## 🔧 Common Usage Patterns

### User Management
```python
from app.crud import user

# Create user with hashed password
new_user = user.create(session=session, obj_in=user_create_data)

# Authenticate user
authenticated_user = user.authenticate(
    session=session, 
    email="user@example.com", 
    password="plaintext_password"
)

# Update user (handles password hashing automatically)
updated_user = user.update(session=session, db_obj=existing_user, obj_in=update_data)

# Check user status
if user.is_active(user_obj) and user.is_superuser(user_obj):
    # User is active superuser
    pass
```

### Company Management
```python
from app.crud import company

# Create company with owner
new_company = company.create_with_owner(
    session=session, 
    obj_in=company_data, 
    created_by=user_id
)

# Get companies by owner
companies, total = company.get_by_owner(
    session=session, 
    owner_id=user_id, 
    skip=0, 
    limit=10
)

# Get only active companies
active_companies, count = company.get_active(session=session)
```

### Branch Management
```python
from app.crud import branch

# Create branch
new_branch = branch.create_with_owner(
    session=session, 
    obj_in=branch_data, 
    created_by=user_id
)

# Get branches by company
company_branches, total = branch.get_by_company(
    session=session, 
    company_id=company_id
)

# Get user's accessible branches
accessible_branch_ids = [branch1.id, branch2.id]
accessible_branches, count = branch.get_accessible_by_user(
    session=session, 
    accessible_branch_ids=accessible_branch_ids
)
```

### Branch-User Relationships
```python
from app.crud import branch_user

# Assign user to branch
assignment = branch_user.assign_user_to_branch(
    session=session,
    branch_id=branch_id,
    user_id=user_id,
    role="manager",
    assigned_by=current_user_id
)

# Get all users in a branch
users_in_branch, total = branch_user.get_branch_users(
    session=session, 
    branch_id=branch_id
)

# Get all branches for a user
user_branches, total = branch_user.get_user_branches(
    session=session, 
    user_id=user_id
)

# Check access
has_access = branch_user.user_has_branch_access(
    session=session, 
    user_id=user_id, 
    branch_id=branch_id
)

# Get accessible branch IDs
accessible_ids = branch_user.get_user_accessible_branches(
    session=session, 
    user_id=user_id
)

# Get users by role in branch
managers, count = branch_user.get_users_by_role(
    session=session, 
    branch_id=branch_id, 
    role="manager"
)
```

## 🔄 Backward Compatibility

All existing code will continue to work without changes because:

1. **Legacy functions** in `legacy_functions.py` wrap the new CRUD classes
2. **Same function signatures** are maintained
3. **Import paths** remain the same: `from app import crud`

## 🧪 Testing

Each CRUD class can be tested independently:

```python
def test_user_crud():
    from app.crud import user
    
    # Test user creation
    new_user = user.create(session=session, obj_in=user_data)
    assert new_user.email == user_data.email
    
    # Test user authentication
    auth_user = user.authenticate(
        session=session, 
        email=user_data.email, 
        password=user_data.password
    )
    assert auth_user is not None
```

## 🚀 Next Steps

1. **Gradual Migration**: Start using the new CRUD classes in new code
2. **Update Existing Code**: Gradually refactor existing route handlers to use new classes
3. **Add More Methods**: Extend CRUD classes with domain-specific methods as needed
4. **Remove Legacy**: Once all code is migrated, remove `legacy_functions.py`

## 📝 Adding New Entities

To add a new entity (e.g., `Product`):

1. **Create model** in `models.py`
2. **Create CRUD class**:
   ```python
   # app/crud/crud_product.py
   from app.models import Product, ProductCreate, ProductUpdate
   from .base import CRUDBase

   class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
       def get_by_category(self, session, *, category: str):
           # Custom method
           pass

   product = CRUDProduct(Product)
   ```
3. **Export in __init__.py**:
   ```python
   from .crud_product import product
   ```
4. **Add legacy functions** if needed for backward compatibility

This modular approach makes the codebase much more maintainable and follows clean architecture principles!
