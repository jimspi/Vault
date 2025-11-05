# 🎨 Dashboard Redesign - Insights First (In Progress)

## 🎯 Goal
Transform Vault from a document-focused app to an **insights-first** platform where insights dominate the screen and everything else is supporting infrastructure.

---

## ✅ COMPLETED (Part 1 - Infrastructure)

### 1. **Compact Sidebar Components**

#### `/src/components/dashboard/CompactDocuments.tsx` ✅
- Collapsible sidebar section showing documents
- Minimal list view: filename + date + delete icon
- Click to expand/preview document content
- Integrated delete functionality with toast notifications

#### `/src/components/dashboard/CompactUpload.tsx` ✅
- Collapsible sidebar section for uploads
- Compact drop zone (much smaller than current)
- Drag & drop support
- Progress indicator during upload
- Auto-collapses after successful upload

### 2. **Floating Action Buttons**

#### `/src/components/dashboard/FloatingActionButtons.tsx` ✅
- **Primary FAB** (large): "✨ Generate AI Insights"
  - Shows document count badge
  - Positioned bottom-right
  - Triggers InsightGenerationOverlay animation
- **Secondary FAB** (smaller): "💡 Create Insight"
  - Opens CreateInsightDialog
  - Positioned above primary FAB
- Fixed positioning with z-index 40
- Smooth hover animations with scale transform

### 3. **Email Functionality**

#### `/src/app/api/insights/email/route.ts` ✅
- POST endpoint for emailing insights
- Accepts array of insight IDs
- Optional custom email address
- Fetches insights with related documents
- Generates styled HTML email template
- Includes:
  - Type emojis (🔄 Pattern, ⚠️ Contradiction, 💡 Suggestion, etc.)
  - AI Generated vs Manual badges
  - Document sources ("📄 Based on: ...")
  - "View All Insights" CTA button
- Currently logs preview (needs actual email service integration)

---

## 🚧 PENDING (Part 2 - Integration)

### 4. **Enhanced InsightsFeed Component**

**File:** `/src/components/dashboard/InsightsFeed.tsx` (needs major update)

**Required Changes:**
```typescript
interface InsightsFeedProps {
  workspaceId: string;
  insights: Insight[];
  documents: Document[]; // NEW: Need document data for displaying sources
  onInsightDeleted?: (id: string) => void;
}
```

**New Features Needed:**
- [ ] Display "AI Generated" or "Manual" badge on each insight
- [ ] Show document sources: "📄 Based on: [Doc A], [Doc B]"
- [ ] Make document names clickable (scroll to/highlight in sidebar)
- [ ] Add "📧 Email This" button on AI insights
- [ ] Add checkbox selection mode for bulk email
- [ ] "Email Selected (3)" button appears when insights selected
- [ ] Better empty state with CTAs
- [ ] Search/filter support

**Suggested Structure:**
```tsx
<div className="space-y-3">
  {insights.map(insight => (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TypeIcon />
            <Badge>{insight.type}</Badge>
            {isAI && <Badge variant="secondary">🤖 AI Generated</Badge>}
            {isManual && <Badge variant="outline">👤 Manual</Badge>}
          </div>
          <span className="text-xs">{formatRelativeTime(insight.created_at)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <h3>{insight.title}</h3>
        <p>{insight.content}</p>

        {/* Document Sources */}
        {relatedDocs.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Based on:</span>
            {relatedDocs.map(doc => (
              <button
                key={doc.id}
                onClick={() => scrollToDocument(doc.id)}
                className="underline hover:text-primary"
              >
                {doc.title}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          {isAI && (
            <Button size="sm" onClick={() => emailInsight(insight.id)}>
              <Mail className="h-4 w-4 mr-2" />
              Email This
            </Button>
          )}
          <Button size="sm" variant="ghost">Dismiss</Button>
          <Button size="sm" variant="ghost">Delete</Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### 5. **Main Dashboard Page Restructure**

**File:** `/src/app/dashboard/page.tsx` (needs complete rewrite)

**New Layout:**
```tsx
<div className="flex h-screen">
  {/* Main Content Area - Insights (Full Width) */}
  <div className="flex-1 overflow-y-auto">
    {/* Top Bar */}
    <div className="sticky top-0 bg-background z-30 border-b p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Insights</h1>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <Input
            placeholder="Search insights and documents..."
            className="w-96"
          />
          {/* Filter Dropdown */}
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pattern">Patterns</SelectItem>
              <SelectItem value="contradiction">Contradictions</SelectItem>
              <SelectItem value="suggestion">Suggestions</SelectItem>
              <SelectItem value="trend">Trends</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    {/* Insights Feed */}
    <div className="p-6">
      <InsightsFeed
        workspaceId={workspace.id}
        insights={insights}
        documents={documents}
      />
    </div>
  </div>

  {/* Right Sidebar */}
  <div className="w-80 border-l bg-muted/20 overflow-y-auto p-4">
    <CompactDocuments
      workspaceId={workspace.id}
      documents={documents}
      onDocumentDeleted={handleDocumentDeleted}
    />

    <CompactUpload workspaceId={workspace.id} />
  </div>

  {/* Floating Action Buttons */}
  <FloatingActionButtons
    workspaceId={workspace.id}
    documentCount={documentCount}
    hasInsights={insights.length > 0}
  />
</div>
```

**Data Fetching:**
```typescript
// Fetch ALL insights (not just new ones)
const { data: insights } = await supabase
  .from('insights')
  .select('*')
  .eq('workspace_id', workspace.id)
  .order('created_at', { ascending: false }); // Newest first

// Fetch ALL documents (for sidebar and insight sources)
const { data: documents } = await supabase
  .from('documents')
  .select('id, title, content, upload_date, file_name, file_size, status')
  .eq('workspace_id', workspace.id)
  .eq('status', 'ready')
  .order('upload_date', { ascending: false });
```

### 6. **Search & Filter Functionality**

**Create:** `/src/components/dashboard/InsightsSearchBar.tsx`

**Features:**
- Real-time search across insight titles and content
- Filter dropdown for insight types
- Clear filters button
- Search highlights in results

### 7. **Email Button Component**

**Create:** `/src/components/dashboard/EmailInsightButton.tsx`

```typescript
interface EmailInsightButtonProps {
  insightIds: string[];
  variant?: 'single' | 'bulk';
}

export default function EmailInsightButton({ insightIds, variant = 'single' }: EmailInsightButtonProps) {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleEmail = async () => {
    setSending(true);

    try {
      const response = await fetch('/api/insights/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();

      toast({
        title: 'Email Sent!',
        description: data.message,
      });
    } catch (error) {
      toast({
        title: 'Email Failed',
        description: 'Could not send insights via email',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      size={variant === 'bulk' ? 'default' : 'sm'}
      onClick={handleEmail}
      disabled={sending}
    >
      {sending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="h-4 w-4 mr-2" />
          {variant === 'bulk' ? `Email Selected (${insightIds.length})` : 'Email This'}
        </>
      )}
    </Button>
  );
}
```

---

## 🗑️ FILES TO REMOVE

Once the new dashboard is working:

1. `/src/app/dashboard/insights/page.tsx` - Insights now on main page
2. `/src/app/dashboard/search/page.tsx` - Search now in top bar
3. `/src/components/dashboard/StatsCards.tsx` - Removed for simplicity
4. `/src/components/dashboard/DashboardClient.tsx` - Replaced by FloatingActionButtons

---

## 🔧 CONFIGURATION NEEDED

### Email Service Integration

Add to `.env.local`:
```bash
# Option 1: Resend (recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Option 2: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

Update `/src/app/api/insights/email/route.ts` to actually send emails:
```typescript
// Install: npm install resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Vault <insights@yourdomain.com>',
  to: recipientEmail,
  subject: `Your Vault AI Insights - ${new Date().toLocaleDateString()}`,
  html: emailHtml,
});
```

---

## 📝 NAVIGATION UPDATES

**Current:**
- Dashboard (/)
- Insights (/dashboard/insights) ← Remove
- Documents (/dashboard) ← Remove tab
- Search (/dashboard/search) ← Remove
- Upload (tab) ← Remove

**New:**
- Dashboard (/) - Shows insights + sidebar
- Settings (/dashboard/settings) - Keep

Update `/src/components/layout/Sidebar.tsx` or nav component to remove old routes.

---

## 🎨 VISUAL HIERARCHY

### Priority 1 (Most Prominent):
- **Insights Feed** - Takes up 70-80% of screen
- **Primary FAB** - Generate AI Insights button (large, colorful)

### Priority 2 (Supporting):
- **Search Bar** - Easy access to filter
- **Secondary FAB** - Create Manual Insight

### Priority 3 (Minimal):
- **Documents Sidebar** - Collapsible, minimal
- **Upload Section** - Hidden until expanded

---

## 🧪 TESTING CHECKLIST

Once complete, test:

- [ ] Insights display correctly (AI vs Manual badges)
- [ ] Document sources show and are clickable
- [ ] Email button works for single insight
- [ ] Bulk email works for multiple insights
- [ ] FAB buttons trigger correct actions
- [ ] Documents sidebar expands/collapses
- [ ] Upload works from sidebar
- [ ] Search filters insights in real-time
- [ ] Type filter dropdown works
- [ ] Delete insight works
- [ ] Responsive on mobile (sidebar becomes drawer?)
- [ ] Empty states display correctly

---

## 🚀 DEPLOYMENT NOTES

Before deploying:
1. Set up email service (Resend recommended)
2. Add environment variables to Vercel
3. Test email delivery in production
4. Update app URL in email template
5. Remove old unused components

---

## 💡 FUTURE ENHANCEMENTS

Post-MVP:
- Export insights to PDF
- Schedule recurring insight emails
- Share insights via unique link
- Insight commenting/notes
- Insight collections/folders
- Dark mode optimization

---

**Status:** Part 1 (Infrastructure) Complete ✅
**Next:** Part 2 (Integration) - Update dashboard page and InsightsFeed

**Estimated remaining work:** 2-3 hours of development + testing
