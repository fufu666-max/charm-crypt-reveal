import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ActiveRaffles from "@/components/ActiveRaffles";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ActiveRaffles />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
