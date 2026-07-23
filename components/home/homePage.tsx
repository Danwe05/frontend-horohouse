import HeroSection from './heroSection';
import PopularDestinations from './popularDestinations';
import LocationBasedProperties from './LocationBasedProperties';
import RecentlyAddedProperties from './recentlyAddedProperties';
import HowItWorks from './howItWorks';
import TopShortTerm from './topShortTerm';
import TopHotels from './topHotels';
import TopListing from './topListing';
import BecomeHostCTA from './becomeHostCTA';
import RecentlyViewedProperties from './recentlyViewedProperties';
import CustomersSay from './customersSay';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <RecentlyViewedProperties />
      <LocationBasedProperties />
      <TopListing />
      {/* <PopularDestinations /> */}
      <RecentlyAddedProperties />
      <TopShortTerm />
      <TopHotels />
      {/* <HowItWorks /> */}
      <CustomersSay />
      <BecomeHostCTA />
    </>
  );
}