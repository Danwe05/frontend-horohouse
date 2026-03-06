import HeroSection from './heroSection';
import WhatWeOffer from './whatWeOffer';
import LuxuriousHaven from './luxuriousHaven';
import TopListing from './topListing';
import AboutUs from './aboutUs';
import CustomersSay from './customersSay';
import Footer from '../footer';
import OurParteners from './ourParteners';
import StudentSection from './StudentSection';
import LocationBasedProperties from './LocationBasedProperties';
import RecentlyViewedProperties from './recentlyViewedProperties';
import PropertyTypeCards from './propertyTypeCards';
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <RecentlyViewedProperties/>
      <LuxuriousHaven />
      <LocationBasedProperties/>
      <WhatWeOffer />
      <TopListing />
      <PropertyTypeCards />
      {/* <StudentSection /> */}
      <AboutUs />
      <OurParteners />
      <CustomersSay />
      <Footer />
      
    </>
  );
}