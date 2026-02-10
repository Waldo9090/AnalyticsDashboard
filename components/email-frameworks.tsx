"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, Mail, RefreshCw, Filter, ChevronDown, FileText, Layers } from "lucide-react"

interface EmailTemplate {
  id: string
  campaignName: string
  campaignId: string
  workspaceName: string
  category: 'roger' | 'reachify' | 'prusa'
  subsequenceId: string
  subsequenceName: string
  sequenceIndex: number
  stepIndex: number
  variantIndex: number
  subject: string
  body: string
  step_name: string
  variant_name: string
}

interface EmailFrameworksProps {
  category?: 'roger' | 'reachify' | 'prusa' | 'all'
}

export function EmailFrameworks({ category = 'all' }: EmailFrameworksProps) {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchEmailTemplates()
  }, [category])

  const fetchEmailTemplates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category && category !== 'all') {
        params.append('category', category)
      }

      console.log('Fetching email templates with params:', params.toString())
      const response = await fetch(`/api/instantly/email-templates?${params.toString()}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Email templates API response:', result)
        setEmailTemplates(result.emailTemplates || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch email templates:', response.status, errorText)
        setEmailTemplates([])
      }
    } catch (error) {
      console.error('Error fetching email templates:', error)
      setEmailTemplates([])
    } finally {
      setLoading(false)
    }
  }

  // Helper function to convert HTML to plain text for search and preview
  const htmlToPlainText = (html: string) => {
    if (!html) return ''
    // Remove HTML tags and decode common HTML entities
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace encoded ampersands
      .replace(/&lt;/g, '<') // Replace encoded less than
      .replace(/&gt;/g, '>') // Replace encoded greater than
      .replace(/&quot;/g, '"') // Replace encoded quotes
      .replace(/&#39;/g, "'") // Replace encoded apostrophes
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim()
  }

  const filteredTemplates = emailTemplates.filter(template => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const plainTextBody = htmlToPlainText(template.body || '')
    
    return (
      template.subject?.toLowerCase().includes(searchLower) ||
      template.campaignName?.toLowerCase().includes(searchLower) ||
      plainTextBody.toLowerCase().includes(searchLower) ||
      template.step_name?.toLowerCase().includes(searchLower) ||
      template.variant_name?.toLowerCase().includes(searchLower) ||
      template.subsequenceName?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'roger': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
      case 'reachify': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      case 'prusa': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500 dark:text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading email frameworks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Email Frameworks</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Viewing {filteredTemplates.length} of {emailTemplates.length} email templates
            {category !== 'all' && ` from ${category} campaigns`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Search
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          
          <Button
            onClick={fetchEmailTemplates}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Panel */}
      {showFilters && (
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search Templates</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <Input
                placeholder="Search by subject, campaign, step, body content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Email Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List Panel */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Email Templates ({filteredTemplates.length})
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No email templates found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                        {template.subject || 'No Subject'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {template.step_name} • {template.variant_name}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                        {htmlToPlainText(template.body || '').substring(0, 100)}
                        {htmlToPlainText(template.body || '').length > 100 ? '...' : ''}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Seq {template.sequenceIndex}.{template.stepIndex}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 truncate">
                      {template.campaignName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {template.subsequenceName}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Template Preview Panel */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Email Template Preview</h3>
          
          {selectedTemplate ? (
            <div className="space-y-4">
              {/* Template Header */}
              <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${getCategoryColor(selectedTemplate.category)}`}>
                    {selectedTemplate.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                      Template
                    </span>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Sequence {selectedTemplate.sequenceIndex} • Step {selectedTemplate.stepIndex} • Variant {selectedTemplate.variantIndex}
                      </span>
                    </div>
                  </div>
                </div>
                
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  {selectedTemplate.subject || 'No Subject'}
                </h4>
                
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <div><strong>Campaign:</strong> {selectedTemplate.campaignName}</div>
                  <div><strong>Subsequence:</strong> {selectedTemplate.subsequenceName}</div>
                  <div><strong>Step:</strong> {selectedTemplate.step_name}</div>
                  <div><strong>Variant:</strong> {selectedTemplate.variant_name}</div>
                  <div><strong>Workspace:</strong> {selectedTemplate.workspaceName}</div>
                </div>
              </div>

              {/* Template Body */}
              <div className="max-h-80 overflow-y-auto">
                <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Email Body:</h5>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                  <div 
                    className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed prose prose-sm max-w-none [&_div]:mb-2 [&_br]:block [&_br]:my-1 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_p]:mb-3"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedTemplate.body || 'No content available' 
                    }}
                    style={{
                      wordBreak: 'break-word'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Select an Email Template</p>
              <p>Choose a template from the list to preview its content and structure</p>
            </div>
          )}
        </Card>
      </div>

      {/* Templates Summary */}
      {filteredTemplates.length > 0 && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Templates Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {filteredTemplates.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Email Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {new Set(filteredTemplates.map(t => t.campaignId)).size}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {new Set(filteredTemplates.map(t => t.subsequenceId)).size}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Subsequences</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}