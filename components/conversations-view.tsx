"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { MessageCircleIcon, SendIcon, CheckCircleIcon, SparklesIcon } from "lucide-react"

type ConversationListItem = {
    id: string
    customer_phone: string
    last_message: string | null
    last_message_time: string | null
    customer_summary: string | null
    is_resolved: boolean | null
    created_at: string
}

type Message = {
    id: string
    sender: "bot" | "customer"
    content: string
    timestamp: string
}

type ConversationDetail = {
    conversation: ConversationListItem
    messages: Message[]
}

function formatTimeAgo(timestamp: string | null): string {
    if (!timestamp) return ""
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function formatMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function ConversationsView() {
    const [conversations, setConversations] = useState<ConversationListItem[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<ConversationDetail | null>(null)
    const [loadingList, setLoadingList] = useState(true)
    const [loadingDetail, setLoadingDetail] = useState(false)

    useEffect(() => {
        fetch('/api/conversations', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const list = data.conversations || []
                setConversations(list)
                setLoadingList(false)
                if (list.length > 0) {
                    setSelectedId(list[0].id)
                }
            })
            .catch(() => setLoadingList(false))
    }, [])

    useEffect(() => {
        if (!selectedId) return
        setLoadingDetail(true)
        fetch(`/api/conversations/${selectedId}/messages`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setDetail(data)
                setLoadingDetail(false)
            })
            .catch(() => setLoadingDetail(false))
    }, [selectedId])

    if (loadingList) {
        return (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
                <div className="text-muted-foreground text-sm">Loading conversations...</div>
            </div>
        )
    }

    if (conversations.length === 0) {
        return (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center flex-col gap-3">
                <MessageCircleIcon className="size-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-muted-foreground text-xs">Once customers message your WhatsApp, they'll show up here.</p>
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6 overflow-hidden">
            {/* LEFT: Conversation list */}
            <aside className="w-[320px] shrink-0 border-r border-border overflow-y-auto">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-sm">Conversations</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{conversations.length} total</p>
                </div>
                <div>
                    {conversations.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedId(c.id)}
                            className={cn(
                                "w-full text-left p-4 border-b border-border/50 transition-colors hover:bg-muted/50",
                                selectedId === c.id && "bg-muted border-l-2 border-l-[var(--chart-1)]"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{c.customer_phone}</span>
                                <span className="text-[10px] text-muted-foreground">{formatTimeAgo(c.last_message_time)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-2">{c.last_message || '—'}</p>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded",
                                c.is_resolved
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-[var(--chart-1)]/10 text-[var(--chart-1)]"
                            )}>
                                {c.is_resolved ? "Resolved" : "Active"}
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* MIDDLE: Chat thread */}
            <section className="flex-1 flex flex-col overflow-hidden">
                {loadingDetail || !detail ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        Loading conversation...
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                                    {detail.conversation.customer_phone.slice(-2)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">{detail.conversation.customer_phone}</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        {detail.conversation.is_resolved ? (
                                            <>
                                                <CheckCircleIcon className="size-3" />
                                                Resolved
                                            </>
                                        ) : (
                                            <>
                                                <span className="size-1.5 rounded-full bg-[var(--chart-1)] animate-pulse" />
                                                Active
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {detail.messages.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-12">
                                    No messages in this conversation
                                </div>
                            ) : (
                                detail.messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex flex-col max-w-[70%]",
                                            m.sender === "bot" ? "items-end ml-auto" : "items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "px-4 py-2.5 rounded-2xl text-sm",
                                            m.sender === "bot"
                                                ? "bg-foreground text-background rounded-br-sm"
                                                : "bg-muted rounded-bl-sm"
                                        )}>
                                            {m.content}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                            {m.sender === "bot" ? "Munshi AI" : "Customer"} · {formatMessageTime(m.timestamp)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-border">
                            <div className="flex items-center gap-2 bg-muted rounded-2xl p-2">
                                <input
                                    type="text"
                                    disabled
                                    placeholder="Manual reply coming soon..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-muted-foreground placeholder:text-muted-foreground"
                                />
                                <button disabled className="size-9 rounded-xl bg-muted-foreground/20 flex items-center justify-center">
                                    <SendIcon className="size-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* RIGHT: Customer info */}
            {detail && (
                <aside className="w-[280px] shrink-0 border-l border-border overflow-y-auto p-6 space-y-6">
                    <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                        <div className="size-16 rounded-full bg-muted flex items-center justify-center font-bold text-lg mb-3">
                            {detail.conversation.customer_phone.slice(-2)}
                        </div>
                        <h4 className="font-semibold text-sm">{detail.conversation.customer_phone}</h4>
                        <p className="text-xs text-muted-foreground mt-1">WhatsApp Customer</p>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</span>
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
                            detail.conversation.is_resolved
                                ? "bg-muted text-muted-foreground"
                                : "bg-[var(--chart-1)]/10 text-[var(--chart-1)]"
                        )}>
                            {detail.conversation.is_resolved ? <CheckCircleIcon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-[var(--chart-1)]" />}
                            {detail.conversation.is_resolved ? "Resolved" : "Active conversation"}
                        </div>
                    </div>

                    {detail.conversation.customer_summary && (
                        <div className="p-4 bg-[var(--chart-1)]/5 border border-[var(--chart-1)]/10 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <SparklesIcon className="size-4 text-[var(--chart-1)]" />
                                <span className="text-[11px] font-bold text-[var(--chart-1)]">AI Summary</span>
                            </div>
                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                                {detail.conversation.customer_summary}
                            </p>
                        </div>
                    )}
                </aside>
            )}
        </div>
    )
}