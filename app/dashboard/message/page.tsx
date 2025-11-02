'use client';
import React, { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/Sidebar';
import MessageList from '@/components/dashboard/MessageList';
import ChatIntro from '@/components/dashboard/ChatIntro';
import Conversation from '@/components/dashboard/Conversation';
import { Menu } from 'lucide-react';
import { SidebarInset } from '@/components/ui/sidebar';
import { NavDash } from '@/components/dashboard/NavDash';

// Définition du type participant
interface Participant {
  id: number;
  name: string;
  avatar: string;
}

const MessagePage = () => {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleMobileSidebar = () => {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

  return (
       <div className="flex min-h-screen w-full">

      {/* Sidebar - Slimmer */}
      <AppSidebar />
      <SidebarInset>
        <NavDash />

      {/* Contenu principal */}
       <div className="flex-1 flex flex-col lg:flex-row min-h-screen pt-14 lg:pt-0">
        {/* MessageList */}
        <div className="flex-1">
          <MessageList onSelectConversation={(participant: Participant) => setSelectedParticipant(participant)} />
        </div>

        {/* ChatIntro OU Conversation */}
        <div
          className={`flex items-center justify-center mt-20 w-full ${
            selectedParticipant ? '-ml-d100' : '-mld-70'
          }`}
        >
          {selectedParticipant ? (
            <Conversation
              conversationId={selectedParticipant.id}
              participantName={selectedParticipant.name}
              participantAvatar={selectedParticipant.avatar}
            />
          ) : (
            <ChatIntro />
          )}
        </div>
      </div>
      </SidebarInset>
    </div>
  );
};

export default MessagePage;
