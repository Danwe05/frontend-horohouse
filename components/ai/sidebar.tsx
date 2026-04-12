"use client"

import type React from "react"
import { useState } from "react"
import {
  MessageSquare,
  Search,
  Trash2,
  ChevronLeft,
  Home,
  Heart,
  Clock,
  Star,
  HelpCircle,
  LogOut,
  MoreHorizontal,
  Building2,
  Sparkles,
  BadgePlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types/ai"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  activeConversationId: string | null
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const todayConversations = filteredConversations.filter((c) => {
    const today = new Date()
    return c.timestamp.toDateString() === today.toDateString()
  })

  const yesterdayConversations = filteredConversations.filter((c) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return c.timestamp.toDateString() === yesterday.toDateString()
  })

  const olderConversations = filteredConversations.filter((c) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return c.timestamp < yesterday && c.timestamp.toDateString() !== yesterday.toDateString()
  })

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "z-50 flex w-72 shrink-0 flex-col bg-gray-50 border-r border-border transition-transform duration-300 ease-in-out",
          // Desktop: sticky positioning
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          // Mobile: fixed positioning
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:h-full",
          // Toggle visibility
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logoHoroHouseBleueOrdinateur.png"
              alt="HoroHouse"
              className="h-10"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-black lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 py-4 shrink-0">
          <Button
            onClick={onNewChat}
            className="w-full justify-center gap-2 rounded-xl bg-blue-600 py-5 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:-xl"
          >
            <BadgePlus className="h-4 w-4" />
            Nouvelle conversation
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="h-10 rounded-xl border border-gray-300 bg-white pl-10 text-sm text-black placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          {todayConversations.length > 0 && (
            <ConversationGroup
              title="Aujourd'hui"
              conversations={todayConversations}
              activeId={activeConversationId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          )}
          {yesterdayConversations.length > 0 && (
            <ConversationGroup
              title="Hier"
              conversations={yesterdayConversations}
              activeId={activeConversationId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          )}
          {olderConversations.length > 0 && (
            <ConversationGroup
              title="Cette semaine"
              conversations={olderConversations}
              activeId={activeConversationId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          )}
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 p-3 shrink-0">
          <nav className="space-y-0.5">
            <SidebarLink icon={Clock} label="Récemment vus" />
            <SidebarLink icon={Star} label="Mes recherches" />
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 shrink-0">
          <nav className="space-y-0.5">
            <SidebarLink icon={HelpCircle} label="Aide & FAQ" />
            <SidebarLink icon={LogOut} label="Déconnexion" />
          </nav>
        </div>
      </aside>
    </>
  )
}

function ConversationGroup({
  title,
  conversations,
  activeId,
  onSelect,
  onDelete,
}: {
  title: string
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="mb-5 mt-5">
      <h3 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-gray-600">{title}</h3>
      <div className="space-y-0.5">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeId}
            onSelect={() => onSelect(conversation.id)}
            onDelete={() => onDelete(conversation.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer",
        isActive
          ? "bg-blue-100 text-blue-900"
          : "text-gray-700 hover:bg-gray-100 hover:text-black",
      )}
      onClick={onSelect}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{conversation.title}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
              isActive ? "hover:bg-blue-200 text-blue-900" : "hover:bg-gray-200 text-gray-600",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl border-gray-200 bg-white p-1">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function SidebarLink({
  icon: Icon,
  label,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string
}) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-black">
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left font-medium">{label}</span>
      {badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-600">
          {badge}
        </span>
      )}
    </button>
  )
}