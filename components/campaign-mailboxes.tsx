"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Mail } from "lucide-react"

interface MailboxInfo {
  email: string
  campaigns: string[]
}

interface CampaignMailboxesProps {
  category: 'roger' | 'reachify' | 'prusa' | 'all'
}

export function CampaignMailboxes({ category }: CampaignMailboxesProps) {
  const [mailboxes, setMailboxes] = useState<MailboxInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMailboxes() {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams()
        if (category !== 'all') {
          params.append('category', category)
        }
        params.append('limit', '1000')
        params.append('email_type', 'sent') // Only sent emails to get mailbox info

        const response = await fetch(`/api/instantly/emails?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch emails: ${response.statusText}`)
        }

        const result = await response.json()
        const emails = result.emails || []
        
        // Group emails by sending account (from_address_email) to get unique mailboxes
        const mailboxMap = new Map<string, MailboxInfo>()
        
        for (const email of emails) {
          if (email.from_address_email || email.eaccount) {
            const mailboxEmail = email.from_address_email || email.eaccount
            
            if (!mailboxMap.has(mailboxEmail)) {
              mailboxMap.set(mailboxEmail, {
                email: mailboxEmail,
                campaigns: []
              })
            }
            
            const mailboxInfo = mailboxMap.get(mailboxEmail)!
            
            // Add campaign to list if not already added
            if (email.campaignName && !mailboxInfo.campaigns.includes(email.campaignName)) {
              mailboxInfo.campaigns.push(email.campaignName)
            }
          }
        }
        
        const mailboxesList = Array.from(mailboxMap.values())
          .sort((a, b) => a.email.localeCompare(b.email))
        
        setMailboxes(mailboxesList)
      } catch (err) {
        console.error('Error fetching mailboxes:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch mailboxes')
      } finally {
        setLoading(false)
      }
    }

    fetchMailboxes()
  }, [category])

  // Filter mailboxes based on search (search in email address or campaign names)
  const filteredMailboxes = mailboxes.filter(mailbox => 
    !searchTerm || 
    mailbox.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mailbox.campaigns.some(campaign => 
      campaign.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-600">Loading mailboxes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 font-medium mb-2">Error Loading Mailboxes</div>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Campaign Mailboxes</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm">{filteredMailboxes.length} mailboxes</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search mailboxes or campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
      </div>

      {/* Simple Mailboxes List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        {filteredMailboxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Mail className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500">No mailboxes found</p>
            <p className="text-slate-400 text-sm">
              {searchTerm ? 'Try adjusting your search' : 'No sending email accounts detected'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredMailboxes.map((mailbox, index) => (
              <div key={mailbox.email} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                      {mailbox.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-100">{mailbox.email}</div>
                      {mailbox.campaigns.length > 0 && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {mailbox.campaigns.length} campaign{mailbox.campaigns.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show campaigns when filtered */}
                  {searchTerm && mailbox.campaigns.length > 0 && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
                      <span className="font-medium">Campaigns: </span>
                      {mailbox.campaigns.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}