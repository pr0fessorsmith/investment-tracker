import { createClient } from '@/lib/supabase/client'
import { SupabaseTagService } from './supabase/tagService'
import { Tag } from '@/types/transactions'

// Original localStorage-based service for fallback
import { TagService as LocalTagService } from './tagService'

/**
 * Unified Tag Service
 * Uses Supabase when user email is provided (NextAuth), localStorage as fallback
 */
export class UnifiedTagService {
  /**
   * Get all tags
   * @param userEmail - User email from NextAuth session (if authenticated)
   */
  static async getTags(userEmail?: string): Promise<Tag[]> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      console.log(`📊 Fetching tags from Supabase for ${userEmail}`)
      return await SupabaseTagService.getTags()
    } else {
      console.log('📊 Fetching tags from localStorage')
      return LocalTagService.getTags()
    }
  }

  /**
   * Create a new tag
   */
  static async createTag(
    name: string,
    color?: string,
    category?: 'broker' | 'strategy' | 'sector' | 'custom',
    userEmail?: string
  ): Promise<Tag | null> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.createTag(name, color, category, userEmail)
    } else {
      return LocalTagService.createTag(name, color, category)
    }
  }

  /**
   * Update an existing tag
   */
  static async updateTag(
    id: string,
    updates: Partial<Omit<Tag, 'id' | 'createdAt'>>,
    userEmail?: string
  ): Promise<Tag | null> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.updateTag(id, updates)
    } else {
      return LocalTagService.updateTag(id, updates)
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(id: string, userEmail?: string): Promise<boolean> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.deleteTag(id)
    } else {
      return LocalTagService.deleteTag(id)
    }
  }

  /**
   * Get tag by ID
   */
  static async getTagById(id: string, userEmail?: string): Promise<Tag | null> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.getTagById(id)
    } else {
      return LocalTagService.getTagById(id)
    }
  }

  /**
   * Get tags by IDs
   */
  static async getTagsByIds(ids: string[], userEmail?: string): Promise<Tag[]> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.getTagsByIds(ids)
    } else {
      return LocalTagService.getTagsByIds(ids)
    }
  }

  /**
   * Search tags by name
   */
  static async searchTags(query: string, userEmail?: string): Promise<Tag[]> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.searchTags(query)
    } else {
      return LocalTagService.searchTags(query)
    }
  }

  /**
   * Get tags by category
   */
  static async getTagsByCategory(category: string, userEmail?: string): Promise<Tag[]> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.getTagsByCategory(category)
    } else {
      return LocalTagService.getTagsByCategory(category)
    }
  }

  /**
   * Get all categories
   */
  static async getCategories(userEmail?: string): Promise<string[]> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return await SupabaseTagService.getCategories()
    } else {
      return LocalTagService.getCategories()
    }
  }

  /**
   * Check if tag name exists
   */
  static async tagExists(name: string, excludeId?: string, userEmail?: string): Promise<boolean> {
    if (userEmail && SupabaseTagService.isAvailable()) {
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
    category?: 'broker' | 'strategy' | 'sector' | 'custom',
    userEmail?: string
  ): Promise<Tag | null> {
    if (userEmail && SupabaseTagService.isAvailable()) {
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
    callback: (tags: Tag[]) => void,
    userEmail?: string
  ): Promise<(() => void) | null> {
    if (userEmail && SupabaseTagService.isAvailable()) {
      return SupabaseTagService.subscribeToTags(callback)
    }
    
    return null
  }
}
