import { Home, Calendar, MessageSquare, Bell, BarChart3, CreditCard, Star, HelpCircle } from "lucide-react";
import { NavLink } from "./NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Bookings", path: "/bookings" },
  { icon: MessageSquare, label: "Messages", path: "/", badge: 3 },
  { icon: Bell, label: "Notifications", path: "/notifications", badge: 5 },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: Star, label: "Reviews", path: "/reviews" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  return (
    <aside className="w-[227px] bg-sidebarDark h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-pink-400 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="text-sidebarText font-semibold text-lg">StayWise</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebarMuted hover:bg-white/5 transition-all duration-300 group relative"
                activeClassName="bg-white/10 text-sidebarText"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <Badge className="ml-auto bg-primary text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full border-0">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-sidebarMuted mb-3">©2024 StayWise. All rights reserved.</p>
        <p className="text-xs text-sidebarMuted mb-4">Terms of Use</p>
        
        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebarText">Jane Doe</p>
            <p className="text-xs text-sidebarMuted bg-sidebarDark px-2 py-0.5 rounded-full inline-block mt-0.5">
              Admin
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
