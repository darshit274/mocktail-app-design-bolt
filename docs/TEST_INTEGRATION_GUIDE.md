# Test Response System Integration Guide

This guide explains how to integrate the new enhanced test response system with your existing Mocktail Academy frontend.

## Overview

The new system provides:
- ✅ **Enhanced Quiz Taking** with real-time answer saving
- ✅ **Multi-Level Leaderboards** (test, series, category, overall)  
- ✅ **Detailed Results Analysis** with performance insights
- ✅ **User Performance Dashboard** with progress tracking
- ✅ **Backward Compatibility** with existing screens

## Quick Integration

### 1. Update Store Configuration ✅ DONE

The new `testResponseApi` has been added to your Redux store in:
- `store/api/testResponseApi.ts` - New API service
- `store/store.ts` - Updated with testResponseApi integration

### 2. New Screen Routes Available

Add these routes to your navigation:

```typescript
// Enhanced test taking
/test/enhanced-quiz

// Enhanced leaderboards  
/test/enhanced-leaderboard

// Detailed results
/test/enhanced-results

// User performance dashboard
/test/performance-dashboard
```

### 3. Integration Components

Use these components in existing screens:

#### Test Action Buttons
```jsx
import { TestActionButtons } from '@/components/test/TestNavigationIntegration';

// In your test detail screen
<TestActionButtons
  testId={testId}
  testName="Sample Test"
  showPerformanceButton={true}
/>
```

#### Performance Widget
```jsx
import { PerformanceWidget } from '@/components/test/TestNavigationIntegration';

// Compact version for headers/cards
<PerformanceWidget userId={user.uuid} compact={true} />

// Full version for dashboards
<PerformanceWidget userId={user.uuid} />
```

## Navigation Updates

### From Test Series Screen
```javascript
// Instead of old quiz route
router.push('/test/quiz', { testId })

// Use new enhanced route  
router.push('/test/enhanced-quiz', { testId, categoryName: test.name })
```

### From Category Screen
```javascript
// For category-based tests
router.push({
  pathname: '/test/enhanced-quiz',
  params: {
    categoryUuid: category.uuid,
    categoryName: category.name,
    language: 'english'
  }
})
```

### Leaderboard Navigation
```javascript
// Test leaderboard
router.push({
  pathname: '/test/enhanced-leaderboard',
  params: {
    type: 'test',
    id: testId,
    title: 'Test Name Leaderboard'
  }
})

// Series leaderboard  
router.push({
  pathname: '/test/enhanced-leaderboard',
  params: {
    type: 'series', 
    id: seriesId,
    title: 'Series Leaderboard'
  }
})

// Overall leaderboard with timeframe
router.push({
  pathname: '/test/enhanced-leaderboard',
  params: {
    type: 'overall',
    title: 'Overall Leaderboard',
    showTimeframe: 'true'
  }
})
```

## API Usage Examples

### Starting a Test Session
```javascript
import { useStartTestSessionMutation } from '@/store/api/testResponseApi';

const [startTestSession] = useStartTestSessionMutation();

const handleStartTest = async () => {
  try {
    const response = await startTestSession({
      test_id: testId,
      user_id: user.uuid
    }).unwrap();
    
    // Session started, navigate to quiz
    router.push({
      pathname: '/test/enhanced-quiz',
      params: { sessionId: response.data.session.id }
    });
  } catch (error) {
    console.error('Failed to start test:', error);
  }
};
```

### Getting Leaderboard Data
```javascript
import { useGetTestLeaderboardQuery } from '@/store/api/testResponseApi';

const { data, isLoading } = useGetTestLeaderboardQuery({
  testId: 123,
  page: 1,
  limit: 50,
  userId: user.uuid
});

// data.data.leaderboard - Array of leaderboard entries
// data.data.userRank - Current user's rank info
// data.data.pagination - Pagination info
```

### Getting User Performance
```javascript
import { useGetUserTestHistoryQuery } from '@/store/api/testResponseApi';

const { data } = useGetUserTestHistoryQuery({
  userId: user.uuid,
  page: 1,
  limit: 10
});

// data.data.history - Array of test history
// data.data.statistics - Overall performance stats
```

## Screen Integration Examples

### 1. Update Test Series Screen

Add performance widget and enhanced navigation:

```jsx
// In your test series detail screen
import { TestActionButtons, PerformanceWidget } from '@/components/test/TestNavigationIntegration';

export default function SeriesDetailScreen() {
  return (
    <ScrollView>
      {/* Existing series info */}
      
      {/* Add performance widget */}
      <PerformanceWidget userId={user?.uuid} />
      
      {/* Enhanced test actions */}
      <TestActionButtons
        seriesId={seriesId}
        testName={seriesName}
      />
      
      {/* Existing test list */}
    </ScrollView>
  );
}
```

### 2. Update Category Screen

```jsx
// In category detail screen  
import { TestActionButtons } from '@/components/test/TestNavigationIntegration';

export default function CategoryDetailScreen() {
  const startCategoryTest = () => {
    router.push({
      pathname: '/test/enhanced-quiz',
      params: {
        categoryUuid: category.uuid,
        categoryName: category.name,
        language: selectedLanguage
      }
    });
  };

  return (
    <View>
      {/* Existing category info */}
      
      <TestActionButtons
        categoryId={category.id}
        testName={category.name}
      />
    </View>
  );
}
```

### 3. Update Profile/Dashboard Screen

```jsx
// In profile screen
import { PerformanceWidget } from '@/components/test/TestNavigationIntegration';

export default function ProfileScreen() {
  return (
    <ScrollView>
      {/* User info */}
      
      {/* Performance summary */}
      <PerformanceWidget userId={user?.uuid} />
      
      {/* Quick access to performance dashboard */}
      <TouchableOpacity 
        onPress={() => router.push('/test/performance-dashboard')}
      >
        <Text>View Detailed Performance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

## Backward Compatibility

The existing screens continue to work:
- `/test/quiz` - Original quiz screen (still functional)
- `/test/leaderboard` - Original leaderboard (still functional)  
- `/test/results` - Original results (still functional)

However, these don't have the enhanced features like:
- Real-time answer saving
- Detailed performance analytics
- Multi-level leaderboards
- Progress tracking

## Migration Strategy

### Phase 1: Add Enhanced Features (Current)
- ✅ New screens available alongside existing ones
- ✅ Integration components ready
- ✅ APIs working and tested

### Phase 2: Update Navigation (Recommended)
- Update main navigation to use enhanced screens
- Add integration components to existing screens
- Test thoroughly with users

### Phase 3: Deprecate Old Screens (Optional)
- Once enhanced screens are stable
- Redirect old routes to new enhanced versions
- Remove old screen files

## Testing Checklist

### Enhanced Quiz Features
- [ ] Test session starts correctly
- [ ] Answers save automatically  
- [ ] Timer works accurately
- [ ] Question navigation functional
- [ ] Flag/unflag questions works
- [ ] Test submission calculates scores correctly

### Leaderboard Features  
- [ ] Test leaderboards show correct rankings
- [ ] Series leaderboards aggregate properly
- [ ] User rank displays correctly
- [ ] Pagination works
- [ ] Timeframe filters work (overall leaderboard)

### Results & Analytics
- [ ] Results show detailed breakdown
- [ ] Performance level calculated correctly
- [ ] Navigation to leaderboard works
- [ ] Solutions link works
- [ ] Retake functionality works

### Performance Dashboard
- [ ] User history loads correctly
- [ ] Statistics calculate properly
- [ ] Trends show correctly
- [ ] Navigation to leaderboards works

## Troubleshooting

### Common Issues

**1. Session not starting**
- Check user authentication
- Verify testId is valid
- Check backend logs for errors

**2. Answers not saving**
- Check network connectivity
- Verify session is active
- Check auth token validity

**3. Leaderboard not loading**
- Verify testId/seriesId exists
- Check if user has permission
- Check query parameters

**4. Performance data missing**
- User may not have taken tests yet
- Check userId is correct
- Verify database has test entries

### Debug Tools

Enable debugging in components:
```javascript
// Add to component
useEffect(() => {
  console.log('Debug - Component state:', { data, isLoading, error });
}, [data, isLoading, error]);
```

Check Redux DevTools for API state:
- Look for `testResponseApi` state
- Check cached queries
- Monitor mutations

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API endpoints are responding
3. Check database migration status
4. Review this integration guide

The enhanced test system is now ready for production use with comprehensive analytics, real-time features, and seamless integration options!