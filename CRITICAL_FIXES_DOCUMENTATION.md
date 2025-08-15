# CRITICAL FIXES DOCUMENTATION

## Overview
This document records the critical fixes implemented to resolve major UX bugs and architectural issues in the songwriting application.

## 1. 🔐 AUTHENTICATION FIX
**Problem**: 403 Forbidden errors when accessing individual songs (users could see songs in lists but not access them)
**Root Cause**: RTK Query wasn't properly including auth headers in API requests
**Solution**:
- **Fixed in**: `frontend/src/store/api/apiSlice.ts` (lines 61-75)
- **Method**: Added `prepareHeaders` function to RTK Query `fetchBaseQuery`
- **Implementation**:
```typescript
prepareHeaders: async (headers) => {
  headers.set('content-type', 'application/json')

  // Get current session and add auth token if available
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers.set('authorization', `Bearer ${session.access_token}`)
    }
  } catch (error) {
    console.warn('Failed to get auth session for API call:', error)
  }

  return headers
}
```

## 2. 🎯 LEXICAL EDITOR CURSOR JUMPING FIX
**Problem**: Cursor would jump during typing due to optimistic updates re-rendering the editor
**Root Cause**: RTK Query optimistic updates were triggering immediate re-renders during typing
**Solution**:
- **Fixed in**: `frontend/src/store/api/apiSlice.ts` (lines 142-159)
- **Method**: Disabled optimistic updates for `updateSong` mutation
- **Implementation**: Commented out `onQueryStarted` optimistic update logic with detailed explanation

## 3. 📝 LEXICAL BEST PRACTICES ARCHITECTURE
**Problem**: Multiple editor implementations causing state conflicts and cursor issues
**Root Cause**: Mixing controlled/uncontrolled patterns and external state interference
**Solution**:
- **Fixed in**: `frontend/src/components/CleanSongEditor.tsx`
- **Method**: Implemented Lexical best practices:
  1. ✅ Lexical as single source of truth for editor content
  2. ✅ OnChangePlugin pattern with useRef for state capture (line 74-75)
  3. ✅ Direct API calls without Redux caching interference
  4. ✅ No controlled component pattern - no setEditorState during typing
  5. ✅ Serialize to JSON only for persistence, not for UI state sync

## 4. 💾 STRESS PATTERN PERSISTENCE FIX
**Problem**: Stress patterns not persisting to database after analysis
**Root Cause**: Direct API calls in CleanSongEditor bypassing Redux state management
**Solution**:
- **Fixed in**: `frontend/src/components/CleanSongEditor.tsx` (lines 90-130)
- **Method**: Added `checkAndProcessStresses` function to auto-save stress data
- **Implementation**: Automatically processes and saves stress analysis results

## 5. 🏷️ TITLE/ARTIST REVERSION FIX
**Problem**: Title and artist reverting to 'Untitled Song' on save
**Root Cause**: Form state not properly synchronized with save operations
**Solution**:
- **Fixed in**: CleanSongEditor component state management
- **Method**: Proper state synchronization between form fields and save operations

## 6. ↵️ DOUBLE NEWLINE FIX
**Problem**: Double newlines being inserted in Lexical editor
**Root Cause**: Event handling conflicts between different editor implementations
**Solution**:
- **Fixed in**: Lexical plugin architecture in CleanSongEditor
- **Method**: Proper event handling and content serialization

## KEY ARCHITECTURAL DECISIONS

### Direct API vs RTK Query
- **CleanSongEditor**: Uses direct API calls to avoid caching interference
- **Song Lists**: Uses RTK Query for efficient caching and data management
- **Rationale**: Editor needs immediate control over saves without cache invalidation triggering re-renders

### Authentication Pattern
- **RTK Query**: Uses `prepareHeaders` for automatic auth header injection
- **Direct API**: Uses `getAuthHeaders()` method in ApiClient class
- **Both patterns**: Use `supabase.auth.getSession()` for current token

### State Management
- **Editor Content**: Lexical's internal state is source of truth
- **UI State**: React state for loading, saving, error states
- **Form Data**: Local state synchronized on save, not on every change

## CRITICAL: DO NOT REVERT
These fixes address fundamental architectural issues. Reverting any of these changes will reintroduce:
- 403 authentication errors
- Cursor jumping during typing
- Loss of stress pattern data
- Title/artist data loss
- Double newline insertion

## Files Modified
- `frontend/src/store/api/apiSlice.ts` - Authentication headers fix
- `frontend/src/components/CleanSongEditor.tsx` - Lexical best practices implementation
- `frontend/src/lib/api.ts` - Still contains type definitions and utilities
