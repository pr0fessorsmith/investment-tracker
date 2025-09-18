'use client'

import React, { useState, useEffect } from 'react'
import { Tag as TagIcon, Plus, Edit, Trash2, X, Save, Users, Target, Building } from 'lucide-react'
import { TagService } from '../services/tagService'
import { Tag } from '../types/transactions'

interface TagManagerProps {
  isOpen: boolean
  onClose: () => void
  onTagsUpdated?: () => void
}

export default function TagManager({ isOpen, onClose, onTagsUpdated }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [newTagForm, setNewTagForm] = useState({
    name: '',
    color: '#3B82F6',
    category: ''
  })
  const [showNewTagForm, setShowNewTagForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Predefined colors for tags
  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
  ]

  // Load tags
  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = () => {
    const allTags = TagService.getTags()
    setTags(allTags)
  }

  const categories = TagService.getCategories()
  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateTag = () => {
    if (!newTagForm.name.trim()) return

    if (TagService.tagExists(newTagForm.name.trim())) {
      alert('A tag with this name already exists')
      return
    }

    TagService.createTag(
      newTagForm.name.trim(),
      newTagForm.color,
      newTagForm.category || undefined
    )

    loadTags()
    setNewTagForm({ name: '', color: '#3B82F6', category: '' })
    setShowNewTagForm(false)
    onTagsUpdated?.()
  }

  const handleUpdateTag = () => {
    if (!editingTag || !editingTag.name.trim()) return

    if (TagService.tagExists(editingTag.name.trim(), editingTag.id)) {
      alert('A tag with this name already exists')
      return
    }

    TagService.updateTag(editingTag.id, {
      name: editingTag.name.trim(),
      color: editingTag.color,
      category: editingTag.category || undefined
    })

    loadTags()
    setEditingTag(null)
    onTagsUpdated?.()
  }

  const handleDeleteTag = (tag: Tag) => {
    if (confirm(`Are you sure you want to delete the tag "${tag.name}"? This will remove it from all transactions.`)) {
      TagService.deleteTag(tag.id)
      loadTags()
      onTagsUpdated?.()
    }
  }

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'broker': return <Building className="h-4 w-4" />
      case 'strategy': return <Target className="h-4 w-4" />
      case 'sector': return <Users className="h-4 w-4" />
      default: return <TagIcon className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <TagIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Tags</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Add New Tag Button */}
            <button
              onClick={() => setShowNewTagForm(true)}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              New Tag
            </button>
          </div>

          {/* New Tag Form */}
          {showNewTagForm && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Tag</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Robinhood"
                    value={newTagForm.name}
                    onChange={(e) => setNewTagForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category (Optional)
                  </label>
                  <select
                    value={newTagForm.category}
                    onChange={(e) => setNewTagForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">None</option>
                    <option value="broker">Broker</option>
                    <option value="strategy">Strategy</option>
                    <option value="sector">Sector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTagForm(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newTagForm.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagForm.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Create Tag
                </button>
                <button
                  onClick={() => {
                    setShowNewTagForm(false)
                    setNewTagForm({ name: '', color: '#3B82F6', category: '' })
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tags List */}
          <div className="space-y-3">
            {filteredTags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                {editingTag?.id === tag.id ? (
                  /* Edit Mode */
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={editingTag.name}
                      onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    
                    <select
                      value={editingTag.category || ''}
                      onChange={(e) => setEditingTag(prev => prev ? { ...prev, category: e.target.value || undefined } : null)}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">No Category</option>
                      <option value="broker">Broker</option>
                      <option value="strategy">Strategy</option>
                      <option value="sector">Sector</option>
                    </select>

                    <div className="flex gap-2">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setEditingTag(prev => prev ? { ...prev, color } : null)}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            editingTag.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="flex items-center gap-3 flex-1">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">{tag.name}</span>
                    {tag.category && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs text-gray-600 dark:text-gray-300">
                        {getCategoryIcon(tag.category)}
                        {tag.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Created {new Date(tag.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 ml-4">
                  {editingTag?.id === tag.id ? (
                    <>
                      <button
                        onClick={handleUpdateTag}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingTag(tag)}
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredTags.length === 0 && (
              <div className="text-center py-8">
                <TagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery || selectedCategory !== 'all' ? 'No matching tags found' : 'No tags yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first tag to organize your investments'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}