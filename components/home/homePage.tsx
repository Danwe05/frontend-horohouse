import HeroSection from './heroSection';
import TopListing from './topListing';
import TopShortTerm from './topShortTerm';
import TopHotels from './topHotels';
import CustomersSay from './customersSay';
import OurParteners from './ourParteners';
import LocationBasedProperties from './LocationBasedProperties';
import RecentlyViewedProperties from './recentlyViewedProperties';
import InsightsSection from './insightsSection';
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LocationBasedProperties />
      <RecentlyViewedProperties />
      <TopShortTerm />
      <TopHotels />
      <TopListing />
      <InsightsSection />
      <OurParteners />
      <CustomersSay />
    </>
  );
}