import { createClient } from '@/lib/supabase/client'
import { SupabaseTagService } from './supabase/tagService'
import { Tag } from '@/types/transactions'

// Original localStorage-based service for fallback
import { TagService as LocalTagService } from './tagService'

/**
 * Unified Tag Service
 * Uses Supabase when authenticated, localStorage as fallback
 */
export class UnifiedTagService {
  /**
   * Check if user is authenticated
   */
  private static async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch {
      return false
    }
  }

  /**
   * Get all tags
   */
  static async getTags(): Promise<Tag[]> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.getTags()
    } else {
      return LocalTagService.getTags()
    }
  }

  /**
   * Create a new tag
   */
  static async createTag(
    name: string,
    color?: string,
    category?: 'broker' | 'strategy' | 'sector' | 'custom'
  ): Promise<Tag | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.createTag(name, color, category)
    } else {
      return LocalTagService.createTag(name, color, category)
    }
  }

  /**
   * Update an existing tag
   */
  static async updateTag(
    id: string,
    updates: Partial<Omit<Tag, 'id' | 'createdAt'>>
  ): Promise<Tag | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.updateTag(id, updates)
    } else {
      return LocalTagService.updateTag(id, updates)
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(id: string): Promise<boolean> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.deleteTag(id)
    } else {
      return LocalTagService.deleteTag(id)
    }
  }

  /**
   * Get tag by ID
   */
  static async getTagById(id: string): Promise<Tag | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.getTagById(id)
    } else {
      return LocalTagService.getTagById(id)
    }
  }

  /**
   * Get tags by IDs
   */
  static async getTagsByIds(ids: string[]): Promise<Tag[]> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.getTagsByIds(ids)
    } else {
      return LocalTagService.getTagsByIds(ids)
    }
  }

  /**
   * Search tags by name
   */
  static async searchTags(query: string): Promise<Tag[]> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.searchTags(query)
    } else {
      return LocalTagService.searchTags(query)
    }
  }

  /**
   * Get tags by category
   */
  static async getTagsByCategory(category: string): Promise<Tag[]> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.getTagsByCategory(category)
    } else {
      return LocalTagService.getTagsByCategory(category)
    }
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<string[]> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.getCategories()
    } else {
      return LocalTagService.getCategories()
    }
  }

  /**
   * Check if tag name exists
   */
  static async tagExists(name: string, excludeId?: string): Promise<boolean> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.tagExists(name, excludeId)
    } else {
      return LocalTagService.tagExists(name, excludeId)
    }
  }

  /**
   * Get or create tag by name
   */
  static async getOrCreateTag(
    name: string,
    category?: 'broker' | 'strategy' | 'sector' | 'custom'
  ): Promise<Tag | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return await SupabaseTagService.getOrCreateTag(name, category)
    } else {
      return LocalTagService.getOrCreateTag(name, category)
    }
  }

  /**
   * Get random color for new tags
   */
  static getRandomColor(): string {
    return SupabaseTagService.getRandomColor()
  }

  /**
   * Subscribe to real-time tag changes (only works with Supabase)
   */
  static async subscribeToTags(
    callback: (tags: Tag[]) => void
  ): Promise<(() => void) | null> {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth) {
      return SupabaseTagService.subscribeToTags(callback)
    }
    
    return null
  }
}
