"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    GlobeIcon,
    FileTextIcon,
    PenLineIcon,
    UploadCloudIcon,
    Trash2Icon,
    RotateCcwIcon,
    CheckCircle2Icon,
    Loader2Icon,
    DatabaseIcon,
} from "lucide-react"

type TrainingItem = {
    source_type: string
    source_url: string
    chunks_count: number | null
    created_at: string
}

type Tab = "website" | "pdf" | "text"

const progressSteps = [
    { label: "Connecting to website...", threshold: 15 },
    { label: "Crawling pages...", threshold: 50 },
    { label: "Extracting content...", threshold: 80 },
    { label: "Saving to knowledge base...", threshold: 100 },
]

export function TrainingView() {
    const supabase = createClient()
    const [businessId, setBusinessId] = useState("")
    const [history, setHistory] = useState<TrainingItem[]>([])
    const [activeTab, setActiveTab] = useState<Tab>("website")
    const [loading, setLoading] = useState(true)

    // Website
    const [websiteUrl, setWebsiteUrl] = useState("")
    const [isTraining, setIsTraining] = useState(false)
    const [progress, setProgress] = useState(0)
    const [progressLabel, setProgressLabel] = useState("")

    // PDF
    const [uploading, setUploading] = useState(false)

    // Text
    const [textInput, setTextInput] = useState("")
    const [textTitle, setTextTitle] = useState("")
    const [textSubmitting, setTextSubmitting] = useState(false)

    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setBusinessId(user.id)
        }
        init()
    }, [])

    useEffect(() => {
        if (businessId) fetchHistory()
    }, [businessId])

    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 4000)
        return () => clearTimeout(t)
    }, [toast])

    async function fetchHistory() {
        try {
            const res = await fetch('/api/train/history', { credentials: 'include' })
            const { data, error } = await res.json()
            if (data && !error) {
                const seen = new Set()
                const unique = data.filter((item: any) => {
                    const key = `${item.source_type}:${item.source_url}`
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                setHistory(unique)
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleWebsiteTraining() {
        if (!websiteUrl.trim()) return
        setIsTraining(true)
        setProgress(0)

        let step = 0
        const interval = setInterval(() => {
            if (step < progressSteps.length) {
                setProgress(progressSteps[step].threshold)
                setProgressLabel(progressSteps[step].label)
                step++
            }
        }, 2500)

        try {
            const res = await fetch('/api/train/scrape-website', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: websiteUrl.trim() }),
            })
            const result = await res.json()
            clearInterval(interval)
            if (result.success) {
                setProgress(100)
                setProgressLabel("Training complete!")
                setToast({ message: `${result.pages_crawled} pages trained successfully`, type: "success" })
                setWebsiteUrl("")
                await fetchHistory()
                setTimeout(() => { setProgress(0); setProgressLabel("") }, 1500)
            } else {
                setToast({ message: result.error || "Training failed", type: "error" })
                setProgress(0)
            }
        } catch (err: any) {
            clearInterval(interval)
            setToast({ message: `Network error: ${err.message}`, type: "error" })
            setProgress(0)
        } finally {
            setIsTraining(false)
        }
    }

    async function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/train/upload-pdf', { method: 'POST', credentials: 'include', body: formData })
            const result = await res.json()
            if (result.success) {
                setToast({ message: `PDF trained — ${result.chunks} chunks`, type: "success" })
                await fetchHistory()
                e.target.value = ""
            } else {
                setToast({ message: result.error || "Upload failed", type: "error" })
            }
        } catch (err: any) {
            setToast({ message: `Error: ${err.message}`, type: "error" })
        } finally {
            setUploading(false)
        }
    }

    async function handleTextSubmit() {
        if (!textInput.trim()) {
            setToast({ message: "Text content required", type: "error" })
            return
        }
        setTextSubmitting(true)
        try {
            const res = await fetch('/api/train/add-text', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput, title: textTitle || 'Manual Entry' }),
            })
            const result = await res.json()
            if (result.success) {
                setToast({ message: "Text added to knowledge base", type: "success" })
                setTextInput("")
                setTextTitle("")
                await fetchHistory()
            } else {
                setToast({ message: result.error || "Failed", type: "error" })
            }
        } catch (err: any) {
            setToast({ message: err.message, type: "error" })
        } finally {
            setTextSubmitting(false)
        }
    }

    async function handleDelete(sourceUrl: string) {
        if (!confirm('Delete this training source?')) return
        try {
            const res = await fetch('/api/train/delete', {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sourceUrl })
            })
            const { error } = await res.json()
            if (!error) {
                setToast({ message: "Deleted", type: "success" })
                await fetchHistory()
            } else {
                setToast({ message: "Delete failed", type: "error" })
            }
        } catch {
            setToast({ message: "Error deleting", type: "error" })
        }
    }

    const websiteCount = history.filter(i => i.source_type === 'website').length
    const pdfCount = history.filter(i => i.source_type === 'pdf').length
    const textCount = history.filter(i => i.source_type === 'text' || i.source_type === 'manual').length
    const totalChunks = history.reduce((sum, i) => sum + (i.chunks_count || 0), 0)

    const sourceIcon = (type: string) => {
        if (type === 'website') return <GlobeIcon className="size-4" />
        if (type === 'pdf') return <FileTextIcon className="size-4" />
        return <PenLineIcon className="size-4" />
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className={cn(
                    "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg",
                    toast.type === "success" ? "bg-[var(--chart-1)] text-background" : "bg-destructive text-destructive-foreground"
                )}>
                    {toast.message}
                </div>
            )}

            <div>
                <h2 className="text-lg font-semibold">Training Center</h2>
                <p className="text-sm text-muted-foreground">Teach your bot about your business and products</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { icon: DatabaseIcon, label: "Total Sources", val: history.length },
                    { icon: GlobeIcon, label: "Websites", val: websiteCount },
                    { icon: FileTextIcon, label: "PDFs", val: pdfCount },
                    { icon: PenLineIcon, label: "Text Entries", val: textCount },
                ].map((s, i) => (
                    <Card key={i} className="shadow-none dark:ring-0">
                        <CardContent className="pt-6">
                            <s.icon className="size-4 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                            <p className="text-2xl font-bold tabular-nums">{s.val}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Input methods */}
                <Card className="shadow-none dark:ring-0">
                    <CardHeader>
                        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                            <button
                                onClick={() => setActiveTab("website")}
                                className={cn(
                                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                                    activeTab === "website" ? "bg-background shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <GlobeIcon className="size-3.5" /> Website
                            </button>
                            <button
                                onClick={() => setActiveTab("pdf")}
                                className={cn(
                                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                                    activeTab === "pdf" ? "bg-background shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <FileTextIcon className="size-3.5" /> PDF
                            </button>
                            <button
                                onClick={() => setActiveTab("text")}
                                className={cn(
                                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                                    activeTab === "text" ? "bg-background shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <PenLineIcon className="size-3.5" /> Text
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeTab === "website" && (
                            <>
                                <div>
                                    <CardTitle className="text-base mb-1">Train from Website</CardTitle>
                                    <CardDescription>Paste a URL — we'll crawl up to 20 pages automatically.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={websiteUrl}
                                        onChange={e => setWebsiteUrl(e.target.value)}
                                        placeholder="https://yourwebsite.com"
                                        disabled={isTraining}
                                        onKeyDown={e => e.key === 'Enter' && !isTraining && handleWebsiteTraining()}
                                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)] disabled:opacity-50"
                                    />
                                    <Button onClick={handleWebsiteTraining} disabled={!websiteUrl.trim() || isTraining}>
                                        {isTraining ? <Loader2Icon className="size-4 animate-spin" /> : "Train"}
                                    </Button>
                                </div>
                                {isTraining && (
                                    <div className="p-4 bg-muted rounded-lg space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{progressLabel || "Starting..."}</span>
                                            <span className="font-semibold">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--chart-1)] rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "pdf" && (
                            <>
                                <div>
                                    <CardTitle className="text-base mb-1">Upload PDF Document</CardTitle>
                                    <CardDescription>Product catalog, price list, FAQ — any text-based PDF.</CardDescription>
                                </div>
                                <input type="file" accept=".pdf" onChange={handlePDFUpload} disabled={uploading} className="hidden" id="pdf-upload" />
                                <label htmlFor="pdf-upload" className="cursor-pointer block">
                                    <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-[var(--chart-1)]/40 hover:bg-[var(--chart-1)]/5 transition-colors">
                                        <UploadCloudIcon className="size-8 mx-auto mb-3 text-muted-foreground" />
                                        <p className="text-sm font-medium mb-1">
                                            {uploading ? "Uploading..." : "Click to upload PDF"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Max 10MB · PDF only</p>
                                    </div>
                                </label>
                            </>
                        )}

                        {activeTab === "text" && (
                            <>
                                <div>
                                    <CardTitle className="text-base mb-1">Add Manual Text</CardTitle>
                                    <CardDescription>Products, FAQs, policies — anything the bot should remember.</CardDescription>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Title (optional)</label>
                                    <input
                                        type="text"
                                        value={textTitle}
                                        onChange={e => setTextTitle(e.target.value)}
                                        placeholder="e.g. Delivery Policy"
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Content</label>
                                    <textarea
                                        value={textInput}
                                        onChange={e => setTextInput(e.target.value)}
                                        placeholder="Business info, products, pricing, policies..."
                                        rows={6}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:border-[var(--chart-1)] resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{textInput.length} / 50,000</p>
                                </div>
                                <Button onClick={handleTextSubmit} disabled={textSubmitting || !textInput.trim()} className="w-full">
                                    {textSubmitting ? <Loader2Icon className="size-4 animate-spin mr-2" /> : null}
                                    Add Training
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* RIGHT: History */}
                <Card className="shadow-none dark:ring-0">
                    <CardHeader>
                        <CardTitle className="text-base">Training History</CardTitle>
                        <CardDescription>Where your bot has learned from</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-10">
                                <DatabaseIcon className="size-8 mx-auto mb-3 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground mb-1">No training data yet</p>
                                <p className="text-xs text-muted-foreground">Use the form on the left to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[420px] overflow-y-auto">
                                {history.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                                        <div className="size-8 rounded-lg bg-[var(--chart-1)]/10 text-[var(--chart-1)] flex items-center justify-center shrink-0">
                                            {sourceIcon(item.source_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Badge variant="outline" className="text-[10px] mb-1 capitalize">{item.source_type}</Badge>
                                            <p className="text-xs font-medium truncate">{item.source_url}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {item.chunks_count ? `${item.chunks_count} chunks · ` : ''}
                                                {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.source_url)}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                            title="Delete"
                                        >
                                            <Trash2Icon className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}