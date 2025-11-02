import HeroSection from './heroSection';
import WhatWeOffer from './whatWeOffer';
import LuxuriousHaven from './luxuriousHaven';
import TopListing from './topListing';
import AboutUs from './aboutUs';
import CustomersSay from './customersSay';
import Footer from '../footer';
import OurParteners from './ourParteners';
import StudentSection from './StudentSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TopListing />
      <WhatWeOffer />
      <LuxuriousHaven />
      {/* <StudentSection /> */}
      <OurParteners />
      <AboutUs />
      <CustomersSay />
      <Footer />
      
    </>
  );
}