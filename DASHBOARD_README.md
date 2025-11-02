# Enhanced Dashboard Documentation

## Overview

The HoroHouse dashboard has been significantly enhanced with role-based features, comprehensive statistics, activity tracking, and property management capabilities. The dashboard adapts its interface and functionality based on the user's role (User, Agent, or Admin).

## Features by Role

### Regular Users (`registered_user`)

#### Dashboard Components:
- **User Statistics**: Favorites, recently viewed, searches, saved searches
- **Quick Actions**: Search properties, manage favorites, saved searches, messages, profile settings
- **Property Overview**: Favorite properties, recently viewed properties
- **Activity Feed**: View history, favorites, searches, inquiries

#### Key Features:
- Browse and search properties
- Save favorite properties
- Create and manage saved searches with alerts
- View recently browsed properties
- Contact agents directly
- Manage user profile and preferences
- Receive notifications for saved searches

### Real Estate Agents (`agent`)

#### Dashboard Components:
- **Agent Statistics**: Total listings, active listings, views, inquiries, sales, revenue, ratings
- **Quick Actions**: Add listings, manage properties, client inquiries, scheduled viewings, analytics
- **Property Management**: My listings with detailed metrics
- **Activity Feed**: New inquiries, property views, sales, client messages

#### Key Features:
- Create and manage property listings
- Upload and manage property photos
- Track property performance (views, favorites, inquiries)
- Manage client inquiries and communications
- Schedule property viewings
- Generate market reports and analytics
- Client relationship management
- Revenue and commission tracking
- Review and rating management

### Administrators (`admin`)

#### Dashboard Components:
- **Admin Statistics**: Total users, agents, properties, platform revenue, system health
- **Quick Actions**: User management, property approvals, agent verification, system monitoring
- **Platform Overview**: System metrics, recent activity, pending tasks
- **Activity Feed**: System events, approvals, revenue updates, user reports

#### Key Features:
- User and agent management
- Property listing approvals
- Agent verification and onboarding
- Platform analytics and reporting
- System health monitoring
- Content management
- Revenue tracking and financial reports
- Handle user reports and support tickets
- System configuration and settings

## Component Architecture

### Core Components

#### 1. DashboardStats
- **Location**: `/components/dashboard/DashboardStats.tsx`
- **Purpose**: Role-specific statistics display
- **Components**: `UserStats`, `AgentStats`, `AdminStats`

#### 2. RecentActivity
- **Location**: `/components/dashboard/RecentActivity.tsx`
- **Purpose**: Activity feed with different activity types
- **Features**: Time-based sorting, metadata display, action icons

#### 3. QuickActions
- **Location**: `/components/dashboard/QuickActions.tsx`
- **Purpose**: Role-specific action buttons
- **Components**: `UserQuickActions`, `AgentQuickActions`, `AdminQuickActions`

#### 4. PropertyOverview
- **Location**: `/components/dashboard/PropertyOverview.tsx`
- **Purpose**: Property display and management
- **Components**: `FavoriteProperties`, `AgentListings`, `RecentlyViewed`

### API Integration

#### Dashboard API Service
- **Location**: `/lib/dashboard-api.ts`
- **Purpose**: Centralized API calls for dashboard data
- **Features**: Role-specific endpoints, error handling, fallback data

#### Key API Endpoints:
```typescript
// User APIs
GET /users/me/stats
GET /users/me/favorites
GET /users/me/activity
GET /users/me/recently-viewed
GET /users/me/saved-searches

// Agent APIs
GET /agents/me/stats
GET /properties/my/properties
GET /agents/me/inquiries
GET /agents/me/activity

// Admin APIs
GET /admin/stats
GET /admin/activity
GET /admin/pending-approvals
GET /admin/system-health
```

## Usage Examples

### Adding New Dashboard Components

1. **Create the component**:
```tsx
// components/dashboard/NewComponent.tsx
export const NewComponent: React.FC<Props> = ({ data, onAction }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Feature</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

2. **Import and use in dashboard**:
```tsx
// app/dashboard/page.tsx
import { NewComponent } from '@/components/dashboard/NewComponent';

// In the dashboard component
<NewComponent data={dashboardData} onAction={handleAction} />
```

### Handling Actions

The dashboard uses a centralized action handler:

```tsx
const handleAction = (action: string, propertyId?: string) => {
  switch (action) {
    case 'search':
      router.push('/search');
      break;
    case 'add-listing':
      router.push('/agent/add-listing');
      break;
    case 'view-property':
      router.push(`/properties/${propertyId}`);
      break;
    // Add more actions
  }
};
```

### Adding New Statistics

1. **Update the stats interface**:
```tsx
// lib/dashboard-api.ts
interface DashboardStats {
  user: {
    // existing stats
    newStat: number;
  };
}
```

2. **Update the stats component**:
```tsx
// components/dashboard/DashboardStats.tsx
<StatsCard
  title="New Metric"
  value={stats.newStat}
  description="Description"
  icon={<Icon className="h-4 w-4" />}
/>
```

## Styling and Theming

The dashboard uses Tailwind CSS with a consistent design system:

### Color Scheme:
- **Primary**: Blue tones for main actions
- **Success**: Green for positive metrics
- **Warning**: Yellow for pending items
- **Error**: Red for issues
- **Neutral**: Gray for secondary information

### Component Patterns:
- **Cards**: White background with subtle shadows
- **Stats**: Large numbers with trend indicators
- **Actions**: Consistent button styling with icons
- **Badges**: Color-coded status indicators

## Performance Considerations

### Data Loading:
- Lazy loading for non-critical components
- Skeleton states during loading
- Error boundaries for graceful failures
- Caching for frequently accessed data

### Optimization:
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers
- Virtual scrolling for large lists

## Testing

### Component Testing:
```tsx
// __tests__/dashboard/DashboardStats.test.tsx
import { render, screen } from '@testing-library/react';
import { UserStats } from '@/components/dashboard/DashboardStats';

test('renders user stats correctly', () => {
  const mockStats = {
    favorites: 10,
    recentlyViewed: 20,
    searches: 30,
    savedSearches: 5
  };
  
  render(<UserStats stats={mockStats} />);
  
  expect(screen.getByText('10')).toBeInTheDocument();
  expect(screen.getByText('Favorite Properties')).toBeInTheDocument();
});
```

### API Testing:
```tsx
// __tests__/lib/dashboard-api.test.tsx
import { dashboardApi } from '@/lib/dashboard-api';

test('fetches user stats', async () => {
  const stats = await dashboardApi.getUserStats();
  expect(stats).toHaveProperty('favorites');
  expect(stats).toHaveProperty('recentlyViewed');
});
```

## Future Enhancements

### Planned Features:
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Analytics**: Charts and graphs with Chart.js
3. **Mobile Optimization**: Responsive design improvements
4. **Customizable Dashboard**: Drag-and-drop widget arrangement
5. **Export Features**: PDF reports and data export
6. **Integration APIs**: Third-party service connections
7. **Advanced Notifications**: Push notifications and email alerts
8. **Multi-language Support**: Internationalization

### Technical Improvements:
1. **State Management**: Redux or Zustand for complex state
2. **Caching**: React Query for server state management
3. **Performance**: Code splitting and lazy loading
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Testing**: Comprehensive test coverage
6. **Documentation**: Interactive component documentation

## Troubleshooting

### Common Issues:

1. **Data Not Loading**:
   - Check API endpoints are accessible
   - Verify authentication tokens
   - Check network connectivity

2. **Role-based Features Not Showing**:
   - Verify user role in auth context
   - Check role-based conditional rendering
   - Ensure proper permissions

3. **Performance Issues**:
   - Check for unnecessary re-renders
   - Optimize large data sets
   - Implement proper memoization

### Debug Mode:
Enable debug logging by setting:
```tsx
const DEBUG_MODE = process.env.NODE_ENV === 'development';
```

## Contributing

When adding new dashboard features:

1. Follow the existing component structure
2. Add proper TypeScript types
3. Include error handling
4. Add loading states
5. Write tests for new components
6. Update this documentation

## Support

For questions or issues with the dashboard:
1. Check this documentation
2. Review component source code
3. Check the API documentation
4. Create an issue in the project repository