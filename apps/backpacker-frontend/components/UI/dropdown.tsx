'use client'
import React, { useState, useRef, useEffect } from 'react'

interface MultiSelectProps {
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
  heading?: string
  required?: boolean
}

const AVAILABLE_TAGS = [
  'Action', 'Adventure', 'RPG', 'Strategy', 
  'Simulation', 'Sports', 'Racing', 'Puzzle',
  'Horror', 'Online', 'Multiplayer', 'Story-Rich',
  'Indie', 'Casual', 'Open World', 'First-Person',
  'Third-Person', 'Pixel Graphics', 'Retro', 'Arcade'
]

export const MultiSelect: React.FC<MultiSelectProps> = ({
  selectedTags,
  setSelectedTags,
  heading = 'Tags',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter tags based on search term
  const filteredTags = AVAILABLE_TAGS.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="w-full max-w-md mb-4" ref={dropdownRef}>
      <div className="flex items-center mb-1">
        <label className="text-sm font-medium text-gray-700">
          {heading}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Selected tags display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-full text-sm 
                     bg-blue-100 text-blue-800"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-blue-900"
            >
              x
            </button>
          </span>
        ))}
      </div>

      {/* Dropdown button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left text-sm border rounded-md 
                   hover:border-web-accent-blue-2 focus:outline-none focus:ring-2 
                   focus:ring-web-accent-blue-2"
        >
          Select tags...
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md 
                        shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none 
                         focus:ring-2 focus:ring-web-accent-blue-2"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Tag options */}
            <div className="py-1">
              {filteredTags.map(tag => (
                <div
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100
                            ${selectedTags.includes(tag) ? 'bg-blue-50' : ''}`}
                >
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => {}}
                      className="rounded text-blue-600"
                    />
                    <span>{tag}</span>
                  </label>
                </div>
              ))}
              {filteredTags.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No tags found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}