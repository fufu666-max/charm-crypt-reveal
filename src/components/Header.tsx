import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { useWallet } from "@/hooks/useWallet";

const Header = () => {
  const { isConnected, address, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MysticRaffle Pavilion" className="h-12 w-12 pulse-glow rounded-full" />
          <div>
            <h1 className="text-2xl font-cinzel font-bold glow-text">MysticRaffle</h1>
            <p className="text-xs text-muted-foreground font-crimson">Pavilion</p>
          </div>
        </div>
        
        {isConnected ? (
          <div className="flex items-center gap-3">
            <span className="font-crimson text-sm text-muted-foreground hidden sm:inline">
              {address?.substring(0, 6)}...{address?.substring(38)}
            </span>
            <Button 
              onClick={disconnectWallet}
              variant="outline" 
              className="font-cinzel gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            onClick={connectWallet}
            className="font-cinzel gap-2 bg-primary hover:bg-primary/90 pulse-glow"
          >
            <Wallet className="h-4 w-4" />
            Connect Rainbow Wallet
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
