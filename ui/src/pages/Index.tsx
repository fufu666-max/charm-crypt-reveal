import Header from "@/components/Header";
import RockPaperScissorsGame from "@/components/RockPaperScissorsGame";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <RockPaperScissorsGame />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
