import RaffleCard from "./RaffleCard";
import { Sparkles } from "lucide-react";

const ActiveRaffles = () => {
  const raffles = [
    {
      title: "Crystal Dragon Hoard",
      prize: "500 ETH",
      entries: 1247,
      timeLeft: "2d 14h",
      pricePerEntry: "0.1 ETH",
      status: "active" as const,
    },
    {
      title: "Enchanted Artifact Collection",
      prize: "250 ETH",
      entries: 892,
      timeLeft: "1d 8h",
      pricePerEntry: "0.05 ETH",
      status: "active" as const,
    },
    {
      title: "Mystic Realm Treasury",
      prize: "1000 ETH",
      entries: 2156,
      timeLeft: "Revealing Soon",
      pricePerEntry: "0.2 ETH",
      status: "revealing" as const,
    },
    {
      title: "Arcane Knowledge Tome",
      prize: "100 ETH",
      entries: 543,
      timeLeft: "4d 20h",
      pricePerEntry: "0.025 ETH",
      status: "active" as const,
    },
  ];

  return (
    <section id="active-raffles" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/30 mb-4">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm font-crimson text-foreground">Active Enchantments</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-cinzel font-bold glow-text">
            Current Mystical Raffles
          </h2>
          <p className="text-lg font-crimson text-muted-foreground max-w-2xl mx-auto">
            Cast your encrypted charm tokens and await the ceremonial reveal under cryptographic light beams
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {raffles.map((raffle, index) => (
            <RaffleCard key={index} {...raffle} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActiveRaffles;
