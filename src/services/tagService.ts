import { Tag } from '../types/transactions'

const STORAGE_KEY = 'investment-tags'

// Predefined tag colors
const TAG_COLORS = [
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

// Predefined broker tags
const PREDEFINED_TAGS: Omit<Tag, 'id' | 'createdAt'>[] = [
  { name: 'Robinhood', color: '#00C851', category: 'broker' },
  { name: 'Fidelity', color: '#00A651', category: 'broker' },
  { name: 'Charles Schwab', color: '#00A9CE', category: 'broker' },
  { name: 'E*TRADE', color: '#6B73F4', category: 'broker' },
  { name: 'TD Ameritrade', color: '#40E0D0', category: 'broker' },
  { name: 'Interactive Brokers', color: '#1E3A8A', category: 'broker' },
  { name: 'Long Term', color: '#10B981', category: 'strategy' },
  { name: 'Short Term', color: '#F59E0B', category: 'strategy' },
  { name: 'Dividend', color: '#8B5CF6', category: 'strategy' },
  { name: 'Growth', color: '#3B82F6', category: 'strategy' },
  { name: 'Value', color: '#06B6D4', category: 'strategy' },
  { name: 'Tech', color: '#6366F1', category: 'sector' },
  { name: 'Finance', color: '#059669', category: 'sector' },
  { name: 'Healthcare', color: '#DC2626', category: 'sector' },
  { name: 'Energy', color: '#D97706', category: 'sector' },
]

export class TagService {
  
  // Get all tags from localStorage
  static getTags(): Tag[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
      
      // Initialize with predefined tags if none exist
      const initialTags = this.createPredefinedTags()
      this.saveTags(initialTags)
      return initialTags
    } catch (error) {
      console.error('Error loading tags:', error)
      return []
    }
  }
  
  // Save tags to localStorage
  static saveTags(tags: Tag[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tags))
    } catch (error) {
      console.error('Error saving tags:', error)
    }
  }
  
  // Create a new tag
  static createTag(name: string, color?: string, category?: string): Tag {
    const existingTags = this.getTags()
    const newTag: Tag = {
      id: Date.now().toString(),
      name: name.trim(),
      color: color || this.getRandomColor(),
      category,
      createdAt: new Date().toISOString()
    }
    
    const updatedTags = [...existingTags, newTag]
    this.saveTags(updatedTags)
    return newTag
  }
  
  // Update an existing tag
  static updateTag(id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>): Tag | null {
    const tags = this.getTags()
    const tagIndex = tags.findIndex(t => t.id === id)
    
    if (tagIndex === -1) return null
    
    const updatedTag = { ...tags[tagIndex], ...updates }
    tags[tagIndex] = updatedTag
    this.saveTags(tags)
    return updatedTag
  }
  
  // Delete a tag
  static deleteTag(id: string): boolean {
    const tags = this.getTags()
    const filteredTags = tags.filter(t => t.id !== id)
    
    if (filteredTags.length === tags.length) return false
    
    this.saveTags(filteredTags)
    return true
  }
  
  // Get tag by ID
  static getTagById(id: string): Tag | null {
    const tags = this.getTags()
    return tags.find(t => t.id === id) || null
  }
  
  // Get tags by IDs
  static getTagsByIds(ids: string[]): Tag[] {
    const tags = this.getTags()
    return tags.filter(t => ids.includes(t.id))
  }
  
  // Search tags by name
  static searchTags(query: string): Tag[] {
    const tags = this.getTags()
    const lowerQuery = query.toLowerCase()
    return tags.filter(t => t.name.toLowerCase().includes(lowerQuery))
  }
  
  // Get tags by category
  static getTagsByCategory(category: string): Tag[] {
    const tags = this.getTags()
    return tags.filter(t => t.category === category)
  }
  
  // Get all categories
  static getCategories(): string[] {
    const tags = this.getTags()
    const categories = new Set(tags.map(t => t.category).filter((c): c is string => c !== undefined))
    return Array.from(categories)
  }
  
  // Get a random color for new tags
  static getRandomColor(): string {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
  }
  
  // Create predefined tags
  private static createPredefinedTags(): Tag[] {
    return PREDEFINED_TAGS.map((tag, index) => ({
      ...tag,
      id: `predefined-${index}`,
      createdAt: new Date().toISOString()
    }))
  }
  
  // Check if tag name exists
  static tagExists(name: string, excludeId?: string): boolean {
    const tags = this.getTags()
    return tags.some(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== excludeId)
  }
  
  // Get or create tag by name
  static getOrCreateTag(name: string, category?: string): Tag {
    const existingTag = this.getTags().find(t => t.name.toLowerCase() === name.toLowerCase())
    if (existingTag) return existingTag
    
    return this.createTag(name, undefined, category)
  }
}