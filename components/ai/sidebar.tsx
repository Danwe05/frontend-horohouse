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
import { motion, AnimatePresence } from "framer-motion"

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
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" 
            onClick={onClose} 
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "z-50 flex w-[300px] shrink-0 flex-col bg-[#F7F7F7] border-r border-[#EBEBEB] transition-transform duration-500 ease-in-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:h-full",
          isOpen ? "translate-x-0" : "-translate-x-full shadow-none",
          isOpen && "shadow-2xl lg:shadow-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#DDDDDD] shadow-sm">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#222222]">AI Butler</h2>
              <p className="text-[11px] font-medium text-[#717171] uppercase tracking-wider">HoroHouse Intelligence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full text-[#717171] hover:bg-[#EBEBEB] hover:text-[#222222] lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="px-6 py-2 shrink-0">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-3 rounded-2xl bg-[#222222] hover:bg-black py-6 px-5 text-[14px] font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
          >
            <BadgePlus className="h-5 w-5 text-blue-400" />
            New Assistant Chat
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 shrink-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717171] group-focus-within:text-blue-600 transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="h-11 rounded-xl border-[#DDDDDD] bg-white pl-11 text-[14px] text-[#222222] placeholder:text-[#717171] focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Conversations - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide no-scrollbar">
          {todayConversations.length > 0 && (
            <ConversationGroup
              title="Today"
              conversations={todayConversations}
              activeId={activeConversationId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          )}
          {yesterdayConversations.length > 0 && (
            <ConversationGroup
              title="Yesterday"
              conversations={yesterdayConversations}
              activeId={activeConversationId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          )}
          {olderConversations.length > 0 && (
            <ConversationGroup
              title="Previous"
              conversations={olderConversations}
              activeId={activeConversationId}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          )}
          
          {filteredConversations.length === 0 && searchQuery && (
            <div className="py-12 text-center px-4">
              <Search className="w-10 h-10 text-[#DDDDDD] mx-auto mb-3" />
              <p className="text-[13px] text-[#717171] font-medium leading-relaxed">
                No conversations found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Footer & Quick Links */}
        <div className="bg-white border-t border-[#EBEBEB] p-4 shrink-0 rounded-t-[24px] shadow-[0_-8px_24px_rgba(34,34,34,0.04)]">
          <nav className="space-y-1">
            <SidebarLink icon={Home} label="Return to Home" />
            <SidebarLink icon={Clock} label="Recently Viewed" />
            <SidebarLink icon={HelpCircle} label="Help & AI Guide" />
            <div className="pt-2 mt-2 border-t border-[#F7F7F7]">
              <SidebarLink icon={LogOut} label="Log Out" />
            </div>
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
    <div className="mb-6 first:mt-2">
      <h3 className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#717171]">{title}</h3>
      <div className="space-y-1">
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
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-300 cursor-pointer border",
        isActive
          ? "bg-white border-[#222222] shadow-md text-[#222222]"
          : "text-[#717171] border-transparent hover:bg-white hover:border-[#DDDDDD] hover:text-[#222222] hover:shadow-sm",
      )}
      onClick={onSelect}
    >
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate text-[14px] font-semibold tracking-tight",
          isActive ? "text-[#222222]" : "text-[#484848]"
        )}>
          {conversation.title}
        </p>
        <p className="truncate text-[12px] opacity-60 mt-0.5 font-medium leading-none">
          {conversation.preview.slice(0, 40)}...
        </p>
      </div>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg transition-all",
                isActive ? "hover:bg-[#F7F7F7] text-[#222222]" : "hover:bg-[#F7F7F7] text-[#717171]",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl border-[#EBEBEB] bg-white p-2 shadow-xl">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="rounded-xl px-4 py-3 text-red-600 font-bold text-[14px] focus:bg-red-50 focus:text-red-600 cursor-pointer flex items-center gap-3"
            >
              <Trash2 className="h-4 w-4" />
              Delete Thread
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
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
    <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold text-[#484848] transition-all duration-200 hover:bg-[#F7F7F7] hover:text-[#222222] group">
      <Icon className="h-4 w-4 text-[#717171] group-hover:text-blue-600 transition-colors" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-50 px-1.5 text-[11px] font-bold text-blue-700">
          {badge}
        </span>
      )}
    </button>
  )
}

