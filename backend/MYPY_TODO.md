# MyPy Type Annotation TODO

## Current Status: DISABLED
MyPy is currently disabled in CI/CD pipeline due to extensive type annotation issues.

**Last Analysis:** 2025-08-10
**Error Count:** 90+ errors across all modules
**Estimated Fix Time:** 1-2 weeks focused effort

## Critical Issues Summary

### 1. Missing Type Stubs (Import Errors)
**Priority: HIGH** - These block basic type checking
```
- pydantic_settings
- pydantic
- fastapi
- fastapi.security
- spacy
- g2p_en
- pronouncing
- dotenv
- uvicorn
```

**Solution:** Install available type stubs, create custom .pyi files for others

### 2. Schema Type Mismatches (songs.py)
**Priority: CRITICAL** - Actual runtime bugs
```
Line 244: List[str] assigned to str field (tags)
Line 247: bool assigned to str field (is_archived)
Line 260: dict assigned to str field (metadata)
```

**Root Cause:** Database schema vs. Pydantic model type mismatch
**Solution:** Audit database schema and fix type inconsistencies

### 3. Missing Return Type Annotations
**Priority: MEDIUM** - API functions need explicit return types
```
Files: songs.py (17 functions), auth.py (1), stress_analysis.py (3)
```

**Solution:** Add return type annotations to all API endpoints

### 4. FastAPI Decorator Issues
**Priority: LOW** - Framework limitation
```
90+ "Untyped decorator" warnings across all FastAPI routes
```

**Solution:** Use per-module disable_error_code = misc

### 5. Optional/Union Type Issues
**Priority: MEDIUM** - Modern Python typing
```
Lines 820-821: Implicit Optional detected
Multiple "None | Any" union-attr errors
```

**Solution:** Use explicit Optional[] types, enable no_implicit_optional

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. **Install Type Stubs**
   ```bash
   pip install types-requests types-setuptools
   # Research available stubs for other libraries
   ```

2. **Fix Critical Schema Mismatches**
   - Audit songs.py type assignments (lines 244, 247, 260)
   - Review database schema vs. Pydantic models
   - Fix List[str] vs str inconsistencies

3. **Configure Gradual Adoption**
   ```ini
   [mypy]
   disallow_untyped_defs = False  # Start lenient
   ignore_missing_imports = True
   no_implicit_optional = True    # Fix Optional issues
   ```

### Phase 2: API Functions (Week 2)
1. **Add Return Type Annotations**
   - songs.py: All 17 API endpoints
   - auth.py: get_current_user function
   - stress_analysis.py: 3 missing functions

2. **Handle FastAPI Decorators**
   - Add per-module disable_error_code = misc
   - Document why decorator warnings are acceptable

3. **Gradual Strictness**
   ```ini
   disallow_untyped_defs = True  # Enable after annotations added
   ```

## Testing Strategy

```bash
# Run MyPy incrementally
python -m mypy app/config.py          # Start with simple modules
python -m mypy app/models.py         # Test Pydantic integration
python -m mypy app/songs.py          # Most complex module
python -m mypy app/                   # Full backend check

# Track progress
python -m mypy app/ --no-error-summary | wc -l
```

## Success Criteria

- [ ] MyPy runs without critical errors (0-10 remaining)
- [ ] All API functions have return type annotations
- [ ] Schema type mismatches resolved
- [ ] CI/CD pipeline includes MyPy quality gate
- [ ] Pre-commit hooks include MyPy validation

## Current Configuration

**mypy.ini:** Lenient configuration for gradual adoption
**quality-gate.yml:** MyPy disabled with comprehensive documentation
**.pre-commit-config.yaml:** MyPy hook commented out

## Re-enabling MyPy

Once Phase 1 & 2 are complete:

1. Update mypy.ini to stricter settings
2. Uncomment MyPy hook in .pre-commit-config.yaml
3. Replace disabled MyPy step in quality-gate.yml
4. Update this document to "ENABLED" status

---

**Created:** 2025-08-10
**Last Updated:** 2025-08-10
**Status:** Ready for implementation
