import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Sparkles } from "lucide-react";
import PurchaseCharmDialog from "./PurchaseCharmDialog";

interface RaffleCardProps {
  title: string;
  prize: string;
  entries: number;
  timeLeft: string;
  pricePerEntry: string;
  status: "active" | "revealing" | "completed";
}

const RaffleCard = ({ title, prize, entries, timeLeft, pricePerEntry, status }: RaffleCardProps) => {
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  return (
    <>
    <Card className="parchment-texture border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden group">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-cinzel font-bold text-foreground group-hover:glow-text transition-all">
            {title}
          </h3>
          <Badge 
            variant={status === "active" ? "default" : status === "revealing" ? "secondary" : "outline"}
            className="font-cinzel"
          >
            {status === "active" ? "Active" : status === "revealing" ? "Revealing" : "Completed"}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-crimson">
            <span className="text-muted-foreground">Grand Prize</span>
            <span className="text-secondary font-semibold text-lg">{prize}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm font-crimson">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{entries} Charms Cast</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeLeft}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-crimson text-muted-foreground">
              Price per Charm
            </span>
            <span className="text-lg font-cinzel font-bold text-accent crystal-glow px-3 py-1 rounded">
              {pricePerEntry}
            </span>
          </div>
          
          <Button 
            className="w-full font-cinzel bg-primary hover:bg-primary/90 pulse-glow"
            disabled={status !== "active"}
            onClick={() => status === "active" && setPurchaseDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {status === "active" ? "Cast Your Charm" : status === "revealing" ? "Revealing..." : "Completed"}
          </Button>
        </div>
      </div>
    </Card>
    
    <PurchaseCharmDialog 
      open={purchaseDialogOpen} 
      onOpenChange={setPurchaseDialogOpen}
      raffleName={title}
      pricePerEntry={pricePerEntry}
    />
    </>
  );
};

export default RaffleCard;
