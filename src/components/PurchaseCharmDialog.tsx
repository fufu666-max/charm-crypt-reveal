import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';

interface PurchaseCharmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raffleName?: string;
  pricePerEntry?: string;
}

const PurchaseCharmDialog = ({ open, onOpenChange, raffleName, pricePerEntry }: PurchaseCharmDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const { isConnected } = useWallet();

  const handlePurchase = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Charm Purchased!",
      description: `Successfully purchased ${quantity} charm(s) for ${raffleName || 'the raffle'}`,
    });
    onOpenChange(false);
    setQuantity(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="parchment-texture border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-cinzel glow-text flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Purchase Charm Tokens
          </DialogTitle>
          <DialogDescription className="font-crimson text-muted-foreground">
            {raffleName ? `Casting your charm for: ${raffleName}` : 'Select the number of charms to purchase'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="font-cinzel">
              Number of Charms
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="font-crimson"
            />
          </div>

          {pricePerEntry && (
            <div className="flex justify-between items-center p-4 rounded-lg bg-card/50 border border-border/30">
              <span className="font-cinzel text-muted-foreground">Total Cost</span>
              <span className="font-cinzel text-2xl font-bold text-accent crystal-glow">
                {parseFloat(pricePerEntry.replace('Ξ', '')) * quantity} Ξ
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-cinzel">
            Cancel
          </Button>
          <Button onClick={handlePurchase} className="font-cinzel bg-primary hover:bg-primary/90 pulse-glow">
            <Sparkles className="h-4 w-4 mr-2" />
            Cast {quantity} Charm{quantity > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseCharmDialog;
