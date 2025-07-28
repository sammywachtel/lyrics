import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Types matching backend models
export interface Song {
  id: string
  user_id: string
  title: string
  artist?: string
  lyrics: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SongCreate {
  title: string
  artist?: string
  lyrics: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags: string[]
  metadata: Record<string, any>
}

export interface SongUpdate {
  title?: string
  artist?: string
  lyrics?: string
  status?: 'draft' | 'in_progress' | 'completed' | 'archived'
  tags?: string[]
  metadata?: Record<string, any>
}

export interface SongListResponse {
  songs: Song[]
  total: number
  page: number
  per_page: number
}

export interface SongResponse {
  message: string
  song?: Song
  songs?: Song[]
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
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

  // Health check
  async healthCheck(): Promise<any> {
    return this.request<any>('/health')
  }
}

export const apiClient = new ApiClient()