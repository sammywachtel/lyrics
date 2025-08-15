/**
 * Backend API Client
 *
 * Refactored from lib/api.ts to focus purely on backend communication
 * without any Supabase dependencies
 */

import { authService } from './authService'
import type {
  SongCreate,
  SongUpdate,
  SongSettingsUpdate,
  SongSettingsResponse,
  SongListResponse,
  SongResponse
} from '../types/song'

// Simple fallback to avoid Jest parsing issues with import.meta
const API_BASE_URL = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
  ? 'http://localhost:8001'  // Test environment
  : (typeof window !== 'undefined' && (window as { __VITE_API_URL__?: string }).__VITE_API_URL__) || 'http://localhost:8001'  // Use environment variable or fallback to local

class BackendApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session }, error } = await authService.getSession()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (error) {
      console.warn('Error getting session:', error)
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let headers = await this.getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        console.warn('Received 401, attempting to refresh session...')

        // Try to refresh the session
        const { error } = await authService.refreshSession()

        if (!error) {
          console.log('Session refreshed successfully, retrying request')

          // Retry with new token
          headers = await this.getAuthHeaders()
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              ...headers,
              ...options.headers,
            },
          })

          if (retryResponse.ok) {
            return retryResponse.json()
          }
        }

        // If refresh failed or retry still got 401, sign out
        console.warn('Session refresh failed or retry unsuccessful, signing out user')
        await authService.signOut()
        throw new Error('Session expired. Please log in again.')
      }

      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Song API methods
  async createSong(songData: SongCreate): Promise<SongResponse> {
    return this.request<SongResponse>('/api/songs/', {
      method: 'POST',
      body: JSON.stringify(songData),
    })
  }

  async getSong(songId: string): Promise<SongResponse> {
    return this.request<SongResponse>(`/api/songs/${songId}`)
  }

  async listSongs(
    page: number = 1,
    perPage: number = 10,
    status?: string
  ): Promise<SongListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })

    if (status) {
      params.append('status', status)
    }

    return this.request<SongListResponse>(`/api/songs/?${params}`)
  }

  async updateSong(songId: string, songData: SongUpdate): Promise<SongResponse> {
    return this.request<SongResponse>(`/api/songs/${songId}`, {
      method: 'PUT',
      body: JSON.stringify(songData),
    })
  }

  async deleteSong(songId: string): Promise<void> {
    await this.request<void>(`/api/songs/${songId}`, {
      method: 'DELETE',
    })
  }

  // Song Settings API methods
  async getSongSettings(songId: string): Promise<SongSettingsResponse> {
    return this.request<SongSettingsResponse>(`/api/songs/${songId}/settings`)
  }

  async updateSongSettings(songId: string, settingsData: SongSettingsUpdate): Promise<SongSettingsResponse> {
    return this.request<SongSettingsResponse>(`/api/songs/${songId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
    return this.request<{ status: string; timestamp: string; database: string }>('/health')
  }
}

export const backendApiClient = new BackendApiClient()

// Re-export for backward compatibility
export const apiClient = backendApiClient
