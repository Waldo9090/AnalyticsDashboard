"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Loader2, Search, RefreshCw, Filter, ChevronDown, Layers, Edit, Save, X, ChevronRight, ChevronUp } from "lucide-react"
import { toast } from "sonner"

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
  delay?: number // Days to wait after previous step
  step_type?: string // Type of step (usually 'email')
}

interface EmailFrameworksProps {
  category?: 'roger' | 'reachify' | 'prusa' | 'all'
}

interface SubsequenceData {
  id: string
  name: string
  sequences: Array<{
    steps: Array<{
      type: string
      delay?: number
      variants: Array<{
        subject: string
        body: string
        v_disabled?: boolean
      }>
    }>
  }>
  parent_campaign: string
  workspace: string
}

export function EmailFrameworks({ category = 'all' }: EmailFrameworksProps) {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [editingSubsequence, setEditingSubsequence] = useState<{
    id: string
    campaignId: string
    workspaceId: string
    data: SubsequenceData | null
  } | null>(null)
  const [saving, setSaving] = useState(false)

  // Toggle step expansion
  const toggleStep = (stepKey: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepKey)) {
      newExpanded.delete(stepKey)
    } else {
      newExpanded.add(stepKey)
    }
    setExpandedSteps(newExpanded)
  }

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

  // Get workspace ID from campaign category
  const getWorkspaceId = (category: string): string => {
    switch (category) {
      case 'roger': return '1'
      case 'reachify': return '4'
      case 'prusa': return '2'
      default: return '1'
    }
  }

  // Fetch subsequence data for editing
  const handleEditSubsequence = async (subsequenceId: string, campaignId: string, category: string, workspaceName?: string) => {
    try {
      const workspaceId = getWorkspaceId(category)
      const response = await fetch(`/api/instantly/subsequences/${subsequenceId}?workspace_id=${workspaceId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch subsequence data')
      }
      
      const data = await response.json()
      setEditingSubsequence({
        id: subsequenceId,
        campaignId,
        workspaceId,
        data: data
      })
    } catch (error) {
      console.error('Error fetching subsequence:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load subsequence data')
    }
  }

  // Save subsequence changes
  const handleSaveSubsequence = async () => {
    if (!editingSubsequence || !editingSubsequence.data) return
    
    setSaving(true)
    try {
      const updateData: any = {
        name: editingSubsequence.data.name,
        sequences: editingSubsequence.data.sequences
      }
      
      const response = await fetch(
        `/api/instantly/subsequences/${editingSubsequence.id}?workspace_id=${editingSubsequence.workspaceId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update subsequence')
      }
      
      toast.success('Subsequence updated successfully')
      setEditingSubsequence(null)
      // Refresh templates to show updated data
      fetchEmailTemplates()
    } catch (error) {
      console.error('Error saving subsequence:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update subsequence')
    } finally {
      setSaving(false)
    }
  }

  // Update step variant
  const updateStepVariant = (stepIndex: number, variantIndex: number, field: 'subject' | 'body', value: string) => {
    if (!editingSubsequence || !editingSubsequence.data) return
    
    const updatedData = { ...editingSubsequence.data }
    if (updatedData.sequences[0]?.steps[stepIndex]?.variants[variantIndex]) {
      updatedData.sequences[0].steps[stepIndex].variants[variantIndex][field] = value
      setEditingSubsequence({ ...editingSubsequence, data: updatedData })
    }
  }

  // Update step delay
  const updateStepDelay = (stepIndex: number, delay: number) => {
    if (!editingSubsequence || !editingSubsequence.data) return
    
    const updatedData = { ...editingSubsequence.data }
    if (updatedData.sequences[0]?.steps[stepIndex]) {
      updatedData.sequences[0].steps[stepIndex].delay = delay
      setEditingSubsequence({ ...editingSubsequence, data: updatedData })
    }
  }

  // Update subsequence name
  const updateSubsequenceName = (name: string) => {
    if (!editingSubsequence || !editingSubsequence.data) return
    
    const updatedData = { ...editingSubsequence.data }
    updatedData.name = name
    setEditingSubsequence({ ...editingSubsequence, data: updatedData })
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
            Viewing {filteredTemplates.length} email templates
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search Campaigns & Steps</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <Input
                placeholder="Search by campaign name, subject, step, body content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Campaign Steps Section */}
      {filteredTemplates.length > 0 && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Campaign Steps & Sequences
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            View all email steps in sequence order for each campaign, including follow-up emails and their delays
          </p>
          
          <div className="space-y-8">
            {(() => {
              // Group templates by campaign and subsequence
              const groupedByCampaign = filteredTemplates.reduce((acc, template) => {
                const key = `${template.campaignId}-${template.subsequenceId}`
                if (!acc[key]) {
                  acc[key] = {
                    campaignName: template.campaignName,
                    campaignId: template.campaignId,
                    workspaceName: template.workspaceName,
                    category: template.category,
                    subsequenceName: template.subsequenceName,
                    subsequenceId: template.subsequenceId,
                    steps: [] as EmailTemplate[]
                  }
                }
                acc[key].steps.push(template)
                return acc
              }, {} as Record<string, {
                campaignName: string
                campaignId: string
                workspaceName: string
                category: string
                subsequenceName: string
                subsequenceId: string
                steps: EmailTemplate[]
              }>)

              return Object.values(groupedByCampaign).map((group) => {
                // Sort steps by stepIndex
                const sortedSteps = [...group.steps].sort((a, b) => {
                  if (a.stepIndex !== b.stepIndex) {
                    return a.stepIndex - b.stepIndex
                  }
                  return a.variantIndex - b.variantIndex
                })

                return (
                  <div key={`${group.campaignId}-${group.subsequenceId}`} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    {/* Campaign Header */}
                    <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                              {group.campaignName}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${getCategoryColor(group.category)}`}>
                              {group.category}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            <div><strong>Sequence:</strong> {group.subsequenceName}</div>
                            <div><strong>Workspace:</strong> {group.workspaceName}</div>
                            <div><strong>Total Steps:</strong> {new Set(sortedSteps.map(s => s.stepIndex)).size}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Steps List */}
                    <div className="space-y-4">
                      {(() => {
                        // Get unique steps (by stepIndex) and show each step with all its variants
                        const uniqueSteps = new Map<number, EmailTemplate[]>()
                        
                        sortedSteps.forEach(template => {
                          if (!uniqueSteps.has(template.stepIndex)) {
                            uniqueSteps.set(template.stepIndex, [])
                          }
                          uniqueSteps.get(template.stepIndex)!.push(template)
                        })
                        
                        return Array.from(uniqueSteps.entries())
                          .sort(([a], [b]) => a - b)
                          .map(([stepIndex, stepTemplates]) => {
                            // Sort variants within step
                            const sortedVariants = stepTemplates.sort((a, b) => a.variantIndex - b.variantIndex)
                            const firstVariant = sortedVariants[0]
                            
                            // Get delay - it's the delay for THIS step (days to wait before sending NEXT email)
                            const delay = firstVariant.delay !== undefined ? firstVariant.delay : (stepIndex === 1 ? 0 : undefined)

                            const stepKey = `${group.campaignId}-${group.subsequenceId}-step-${stepIndex}`
                            const isExpanded = expandedSteps.has(stepKey)

                            return (
                              <div key={`step-${stepIndex}`} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-3 bg-slate-50 dark:bg-slate-800/30 rounded-r-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-sm font-semibold">
                                        {stepIndex}
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-slate-800 dark:text-slate-100">
                                          {firstVariant.step_name}
                                        </h5>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                          Type: {firstVariant.step_type || 'email'} • Variants: {sortedVariants.length}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {delay !== undefined && (
                                      <div className="ml-11 mb-2">
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                          <span>⏱️</span>
                                          <span>Delay: {delay === 0 ? 'Immediate' : `${delay} day${delay !== 1 ? 's' : ''} after previous step`}</span>
                                        </span>
                                      </div>
                                    )}

                                    {/* Show subject preview when collapsed */}
                                    {!isExpanded && sortedVariants.length > 0 && (
                                      <div className="ml-11 mt-2">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                          <strong>Subject:</strong> {sortedVariants[0].subject || 'No Subject'}
                                        </div>
                                      </div>
                                    )}

                                    {/* Expanded content */}
                                    {isExpanded && (
                                      <div className="ml-11 space-y-4 mt-4">
                                        {/* Show all variants for this step */}
                                        {sortedVariants.map((variant, variantIdx) => (
                                          <div key={variant.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900">
                                            {sortedVariants.length > 1 && (
                                              <div className="mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                  Variant {variant.variantIndex}: {variant.variant_name}
                                                </span>
                                              </div>
                                            )}
                                            
                                            <div className="space-y-2">
                                              <div>
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                  Subject:
                                                </div>
                                                <div className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                                  {variant.subject || 'No Subject'}
                                                </div>
                                              </div>

                                              <div>
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                  Email Body:
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
                                                  <div 
                                                    className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed prose prose-sm max-w-none [&_div]:mb-2 [&_br]:block [&_br]:my-1 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_p]:mb-3 whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{ 
                                                      __html: variant.body || 'No content available' 
                                                    }}
                                                    style={{
                                                      wordBreak: 'break-word'
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Expand/Collapse Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleStep(stepKey)}
                                    className="ml-4 flex-shrink-0"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-4 h-4 mr-1" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="w-4 h-4 mr-1" />
                                        Show
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )
                          })
                      })()}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </Card>
      )}

      {/* Edit Subsequence Dialog */}
      <Dialog open={editingSubsequence !== null} onOpenChange={(open) => !open && setEditingSubsequence(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {editingSubsequence && editingSubsequence.data && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Subsequence</DialogTitle>
                <DialogDescription>
                  Update the subsequence name, steps, and email content. Changes will be saved to Instantly.ai.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Subsequence Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subsequence Name
                  </label>
                  <Input
                    value={editingSubsequence.data.name}
                    onChange={(e) => updateSubsequenceName(e.target.value)}
                    placeholder="Enter subsequence name"
                    className="w-full"
                  />
                </div>

                {/* Steps */}
                {editingSubsequence.data.sequences[0]?.steps && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Email Steps
                    </h4>
                    {editingSubsequence.data.sequences[0].steps.map((step, stepIndex) => (
                      <Card key={stepIndex} className="p-4 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-sm font-semibold">
                              {stepIndex + 1}
                            </div>
                            <h5 className="font-semibold text-slate-800 dark:text-slate-100">
                              Step {stepIndex + 1}
                            </h5>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600 dark:text-slate-400">
                              Delay (days):
                            </label>
                            <Input
                              type="number"
                              min="0"
                              value={step.delay ?? 0}
                              onChange={(e) => updateStepDelay(stepIndex, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </div>
                        </div>

                        {/* Variants */}
                        <div className="space-y-4">
                          {step.variants.map((variant, variantIndex) => (
                            <div key={variantIndex} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Variant {variantIndex + 1}
                                </span>
                                {variant.v_disabled && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                    Disabled
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Subject
                                  </label>
                                  <Input
                                    value={variant.subject}
                                    onChange={(e) => updateStepVariant(stepIndex, variantIndex, 'subject', e.target.value)}
                                    placeholder="Email subject"
                                    className="w-full"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Body
                                  </label>
                                  <Textarea
                                    value={variant.body}
                                    onChange={(e) => updateStepVariant(stepIndex, variantIndex, 'body', e.target.value)}
                                    placeholder="Email body content"
                                    className="w-full min-h-32 font-mono text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingSubsequence(null)}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSubsequence}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}