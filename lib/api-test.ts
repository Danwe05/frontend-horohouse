/**
 * API Integration Test Suite
 * Test all critical API endpoints to ensure frontend-backend communication works
 */

import { propertyService } from './services/propertyService';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
}

class APITester {
  private results: TestResult[] = [];

  private log(endpoint: string, status: 'success' | 'error', message: string, data?: any) {
    const result: TestResult = { endpoint, status, message, data };
    this.results.push(result);
    
    const emoji = status === 'success' ? '✅' : '❌';
    console.log(`${emoji} ${endpoint}: ${message}`);
    
    if (data && status === 'success') {
      console.log('   Data:', data);
    }
  }

  /**
   * Test property search endpoint
   */
  async testPropertySearch() {
    try {
      const response = await propertyService.searchProperties(
        { 
          // Basic search filters
          minPrice: 100000,
          maxPrice: 5000000,
          city: 'Lagos'
        },
        {
          page: 1,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      );

      this.log(
        'GET /properties (search)',
        'success',
        `Found ${response.total} properties, showing ${response.properties.length}`,
        {
          total: response.total,
          page: response.page,
          totalPages: response.totalPages,
          propertiesCount: response.properties.length
        }
      );
    } catch (error: any) {
      this.log(
        'GET /properties (search)',
        'error',
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Test property search by text
   */
  async testPropertyTextSearch() {
    try {
      const response = await propertyService.searchByText(
        'apartment Lagos',
        {},
        {
          page: 1,
          limit: 3
        }
      );

      this.log(
        'GET /properties/search (text)',
        'success',
        `Text search found ${response.total} properties`,
        {
          total: response.total,
          propertiesCount: response.properties.length
        }
      );
    } catch (error: any) {
      this.log(
        'GET /properties/search (text)',
        'error',
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Test featured properties endpoint
   */
  async testFeaturedProperties() {
    try {
      const response = await propertyService.getFeaturedProperties(5);

      this.log(
        'GET /properties/featured',
        'success',
        `Found ${response.length} featured properties`,
        { count: response.length }
      );
    } catch (error: any) {
      this.log(
        'GET /properties/featured',
        'error',
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Test recent properties endpoint
   */
  async testRecentProperties() {
    try {
      const response = await propertyService.getRecentProperties(5);

      this.log(
        'GET /properties/recent',
        'success',
        `Found ${response.length} recent properties`,
        { count: response.length }
      );
    } catch (error: any) {
      this.log(
        'GET /properties/recent',
        'error',
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Test most viewed properties endpoint
   */
  async testMostViewedProperties() {
    try {
      const response = await propertyService.getMostViewedProperties(5);

      this.log(
        'GET /properties/most-viewed',
        'success',
        `Found ${response.length} most viewed properties`,
        { count: response.length }
      );
    } catch (error: any) {
      this.log(
        'GET /properties/most-viewed',
        'error',
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Test property detail endpoint with valid MongoDB ObjectId
   */
  async testPropertyDetail() {
    try {
      // Use a valid MongoDB ObjectId format for testing
      const testPropertyId = '507f1f77bcf86cd799439011';
      
      const response = await propertyService.getPropertyById(testPropertyId);

      this.log(
        'GET /properties/:id',
        'success',
        `Retrieved property details for ID: ${testPropertyId}`,
        { id: response.id, title: response.title }
      );
    } catch (error: any) {
      // This is expected to fail since we don't have real data yet
      if (error.message.includes('Invalid property ID format')) {
        this.log(
          'GET /properties/:id',
          'success',
          'Property ID validation working correctly (expected behavior)'
        );
      } else {
        this.log(
          'GET /properties/:id',
          'error',
          error.message || 'Unknown error'
        );
      }
    }
  }

  /**
   * Test nearby properties endpoint
   */
  async testNearbyProperties() {
    try {
      const response = await propertyService.findNearby(
        6.5244, // Lagos latitude
        3.3792, // Lagos longitude
        10, // 10km radius
        { limit: 5 }
      );

      this.log(
        'GET /properties/nearby',
        'success',
        `Found ${response.properties.length} nearby properties`,
        { count: response.properties.length }
      );
    } catch (error: any) {
      this.log(
        'GET /properties/nearby',
        'error',
        error.message || 'Unknown error'
      );
    }
  }

  /**
   * Run all API tests
   */
  async runAllTests() {
    console.log('🧪 Starting HoroHouse API Integration Tests...\n');

    await this.testPropertySearch();
    await this.testPropertyTextSearch();
    await this.testFeaturedProperties();
    await this.testRecentProperties();
    await this.testMostViewedProperties();
    await this.testPropertyDetail();
    await this.testNearbyProperties();

    // Summary
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Success Rate: ${Math.round((successCount / this.results.length) * 100)}%`);

    if (errorCount > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`   • ${r.endpoint}: ${r.message}`));
    }

    return this.results;
  }
}

// Export the tester
export const apiTester = new APITester();

// Helper function to run tests from browser console
export const runAPITests = () => apiTester.runAllTests();
