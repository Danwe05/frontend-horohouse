import HeroSection from './heroSection';
import WhatWeOffer from './whatWeOffer';
import LuxuriousHaven from './luxuriousHaven';
import TopListing from './topListing';
import TopShortTerm from './topShortTerm';
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
      <LocationBasedProperties />
      <RecentlyViewedProperties />
      <TopShortTerm />
      <TopListing />
      <LuxuriousHaven />
      <WhatWeOffer />
      <PropertyTypeCards />
      <StudentSection />
      <AboutUs />
      <OurParteners />
      <CustomersSay />
      

    </>
  );
}