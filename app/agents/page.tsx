import { apiClient } from '@/lib/api';
import { Agent } from '@/types/agent';
import { Suspense } from 'react';
import AgentsList from './AgentsList';

export default async function AgentsPage() {
  const agents = await apiClient.getAgents();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Agents</h1>
      <Suspense fallback={<div>Loading agents...</div>}>
        <AgentsList initialAgents={agents} />
      </Suspense>
    </div>
  );
}