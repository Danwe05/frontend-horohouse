import HeroSection from './heroSection';
import TrustSafetyBanner from './trustSafetyBanner';
import PopularDestinations from './popularDestinations';
import LocationBasedProperties from './LocationBasedProperties';
import RecentlyAddedProperties from './recentlyAddedProperties';
import HowItWorks from './howItWorks';
import TopShortTerm from './topShortTerm';
import TopHotels from './topHotels';
import TopListing from './topListing';
import BecomeHostCTA from './becomeHostCTA';
import InsightsSection from './insightsSection';
import RecentlyViewedProperties from './recentlyViewedProperties';
import OurParteners from './ourParteners';
import CustomersSay from './customersSay';
import Newsletter from './newsletter';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <RecentlyViewedProperties />
      <LocationBasedProperties />
      <TopListing />
      <PopularDestinations />
      <RecentlyAddedProperties />
      <TopShortTerm />
      <TopHotels />
      <HowItWorks />
      <TrustSafetyBanner />
      <CustomersSay />
      <OurParteners />
      <InsightsSection />
      <BecomeHostCTA />
      <Newsletter />
    </>
  );
}