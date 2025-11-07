import { Agent } from '@/types/agent';

type AgentsListProps = {
  initialAgents?: Agent[];
};

export default function AgentsList({ initialAgents = [] }: AgentsListProps) {
  const agents = Array.isArray(initialAgents) ? initialAgents : [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <div key={agent.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {agent.profilePicture ? (
                  <img 
                    src={agent.profilePicture} 
                    alt={`${agent.firstName} ${agent.lastName}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xl font-medium">
                    {agent.firstName.charAt(0)}{agent.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{agent.firstName} {agent.lastName}</h3>
                <p className="text-gray-600 text-sm">{agent.title || 'Real Estate Agent'}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p><span className="font-medium">Email:</span> {agent.email}</p>
              <p><span className="font-medium">Phone:</span> {agent.phone || 'Not provided'}</p>
              <p><span className="font-medium">Properties:</span> {agent.propertiesCount || 0}</p>
              <p><span className="font-medium">Experience:</span> {agent.experienceYears || 0} years</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}