import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import PurchaseCharmDialog from "./PurchaseCharmDialog";

const Hero = () => {
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  const scrollToRaffles = () => {
    const rafflesSection = document.getElementById('active-raffles');
    rafflesSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      
      <div className="container mx-auto px-4 py-32 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/30 pulse-glow">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-sm font-crimson text-foreground">Cryptographically Secure</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-cinzel font-bold glow-text leading-tight">
            Every Spell Cast<br />in Secret
          </h1>
          
          <p className="text-xl md:text-2xl font-crimson text-foreground/80 max-w-2xl mx-auto">
            Enter the mystical realm where encrypted charms become raffle entries. 
            Each token holds a secret, revealed only during the ceremonial light beam ritual.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              onClick={() => setPurchaseDialogOpen(true)}
              className="font-cinzel text-lg px-8 py-6 bg-primary hover:bg-primary/90 pulse-glow"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Purchase Charm Tokens
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={scrollToRaffles}
              className="font-cinzel text-lg px-8 py-6 border-secondary text-secondary hover:bg-secondary/10"
            >
              View Active Raffles
            </Button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
    
    <PurchaseCharmDialog 
      open={purchaseDialogOpen} 
      onOpenChange={setPurchaseDialogOpen}
    />
    </>
  );
};

export default Hero;
