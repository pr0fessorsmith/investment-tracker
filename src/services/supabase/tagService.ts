import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import type { Tag } from '@/types/transactions'

type TagRow = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type TagUpdate = Database['public']['Tables']['tags']['Update']

/**
 * Supabase Tag Service
 * Handles all tag-related database operations with cloud storage
 */
export class SupabaseTagService {
  private static supabase = createClient()

  /**
   * Check if Supabase is available
   */
  static isAvailable(): boolean {
    return this.supabase !== null
  }

  /**
   * Convert database row to Tag interface
   */
  private static toTag(row: TagRow): Tag {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      category: row.category,
      createdAt: row.created_at,
    }
  }

  /**
   * Get current user ID from NextAuth session
   * Note: We're using NextAuth for authentication, not Supabase Auth
   */
  private static async getUserId(): Promise<string | null> {
    // User ID should be passed from the calling component that has access to NextAuth session
    // This method is a placeholder for backward compatibility
    console.warn('getUserId() called without user context. User ID should be passed explicitly.')
    return null
  }

  /**
   * Create a new tag with explicit user ID
   */
  static async createTagWithUser(
    userId: string,
    name: string,
    color: string = '#3B82F6',
    category?: 'broker' | 'strategy' | 'sector' | 'custom'
  ): Promise<Tag | null> {
    try {
      if (!this.isAvailable() || !this.supabase) return null
      
      const tagData: TagInsert = {
        user_id: userId,
        name: name.trim(),
        color,
        category: category || 'custom',
      }

      const { data, error } = await this.supabase
        .from('tags')
        .insert(tagData)
        .select()
        .single()

      if (error) {
        console.error('Error creating tag:', error)
        return null
      }

      return this.toTag(data)
    } catch (error) {
      console.error('Error in createTagWithUser:', error)
      return null
    }
  }

  /**
   * Get all tags for the current user
   */
  static async getTags(): Promise<Tag[]> {
    try {
      if (!this.isAvailable() || !this.supabase) return []
      
      const { data, error } = await this.supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching tags:', error)
        return []
      }

      return data?.map(this.toTag) || []
    } catch (error) {
      console.error('Error in getTags:', error)
      return []
    }
  }

  /**
   * Create a new tag
   * @param userEmail - User email from NextAuth (optional, will try to get from Supabase auth if not provided)
   */
  static async createTag(
    name: string,
    color: string = '#3B82F6',
    category?: 'broker' | 'strategy' | 'sector' | 'custom',
    userEmail?: string
  ): Promise<Tag | null> {
    try {
      if (!this.isAvailable() || !this.supabase) return null
      
      let userId: string | null = userEmail || null
      if (!userId) {
        userId = await this.getUserId()
      }
      
      if (!userId) {
        console.error('User not authenticated')
        return null
      }

      const tagData: TagInsert = {
        user_id: userId,
        name: name.trim(),
        color,
        category: category || 'custom',
      }

      const { data, error } = await this.supabase
        .from('tags')
        .insert(tagData)
        .select()
        .single()

      if (error) {
        console.error('Error creating tag:', error)
        return null
      }

      return data ? this.toTag(data) : null
    } catch (error) {
      console.error('Error in createTag:', error)
      return null
    }
  }

  /**
   * Update an existing tag
   */
  static async updateTag(
    id: string,
    updates: Partial<Omit<Tag, 'id' | 'createdAt'>>
  ): Promise<Tag | null> {
    try {
      if (!this.isAvailable() || !this.supabase) return null
      
      const tagUpdate: TagUpdate = {}
      if (updates.name !== undefined) tagUpdate.name = updates.name
      if (updates.color !== undefined) tagUpdate.color = updates.color
      if (updates.category !== undefined) {
        tagUpdate.category = updates.category as 'broker' | 'strategy' | 'sector' | 'custom'
      }

      const { data, error } = await this.supabase
        .from('tags')
        .update(tagUpdate)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating tag:', error)
        return null
      }

      return data ? this.toTag(data) : null
    } catch (error) {
      console.error('Error in updateTag:', error)
      return null
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(id: string): Promise<boolean> {
    try {
      if (!this.isAvailable() || !this.supabase) return false
      
      const { error } = await this.supabase
        .from('tags')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting tag:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteTag:', error)
      return false
    }
  }

  /**
   * Get tag by ID
   */
  static async getTagById(id: string): Promise<Tag | null> {
    try {
      if (!this.isAvailable() || !this.supabase) return null
      
      const { data, error } = await this.supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching tag:', error)
        return null
      }

      return data ? this.toTag(data) : null
    } catch (error) {
      console.error('Error in getTagById:', error)
      return null
    }
  }

  /**
   * Get tags by IDs
   */
  static async getTagsByIds(ids: string[]): Promise<Tag[]> {
    if (ids.length === 0) return []
    if (!this.isAvailable() || !this.supabase) return []

    try {
      const { data, error } = await this.supabase
        .from('tags')
        .select('*')
        .in('id', ids)

      if (error) {
        console.error('Error fetching tags by IDs:', error)
        return []
      }

      return data?.map(this.toTag) || []
    } catch (error) {
      console.error('Error in getTagsByIds:', error)
      return []
    }
  }

  /**
   * Search tags by name
   */
  static async searchTags(query: string): Promise<Tag[]> {
    try {
      if (!this.isAvailable() || !this.supabase) return []
      
      const { data, error } = await this.supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error searching tags:', error)
        return []
      }

      return data?.map(this.toTag) || []
    } catch (error) {
      console.error('Error in searchTags:', error)
      return []
    }
  }

  /**
   * Get tags by category
   */
  static async getTagsByCategory(category: string): Promise<Tag[]> {
    try {
      if (!this.isAvailable() || !this.supabase) return []
      
      const { data, error } = await this.supabase
        .from('tags')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching tags by category:', error)
        return []
      }

      return data?.map(this.toTag) || []
    } catch (error) {
      console.error('Error in getTagsByCategory:', error)
      return []
    }
  }

  /**
   * Get all categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const tags = await this.getTags()
      const categories = new Set(
        tags.map((t) => t.category).filter((c): c is string => c !== undefined)
      )
      return Array.from(categories)
    } catch (error) {
      console.error('Error in getCategories:', error)
      return []
    }
  }

  /**
   * Check if tag name exists
   */
  static async tagExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      if (!this.isAvailable() || !this.supabase) return false
      
      let query = this.supabase
        .from('tags')
        .select('id')
        .ilike('name', name)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error checking tag existence:', error)
        return false
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error in tagExists:', error)
      return false
    }
  }

  /**
   * Get or create tag by name
   */
  static async getOrCreateTag(
    name: string,
    category?: 'broker' | 'strategy' | 'sector' | 'custom'
  ): Promise<Tag | null> {
    try {
      if (!this.isAvailable() || !this.supabase) return null
      
      // Try to find existing tag
      const { data: existing } = await this.supabase
        .from('tags')
        .select('*')
        .ilike('name', name)
        .single()

      if (existing) {
        return this.toTag(existing)
      }

      // Create new tag if not found
      return await this.createTag(name, undefined, category)
    } catch (error) {
      console.error('Error in getOrCreateTag:', error)
      return null
    }
  }

  /**
   * Get random color for new tags
   */
  static getRandomColor(): string {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6B7280', // Gray
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * Subscribe to real-time tag changes
   */
  static subscribeToTags(callback: (tags: Tag[]) => void) {
    if (!this.isAvailable() || !this.supabase) return () => {}
    
    const channel = this.supabase
      .channel('tags_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
        },
        async () => {
          // Reload all tags when any change occurs
          const tags = await this.getTags()
          callback(tags)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }
}
