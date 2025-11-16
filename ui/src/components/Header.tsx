import { ConnectButton } from "@rainbow-me/rainbowkit";
import logo from "@/assets/logo.svg";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Charm Crypt Reveal" className="h-12 w-12 pulse-glow rounded-full" />
          <div>
            <h1 className="text-2xl font-cinzel font-bold glow-text">Charm Crypt Reveal</h1>
            <p className="text-xs text-muted-foreground font-crimson">Privacy-Preserving Rock Paper Scissors</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </header>
  );
};

export default Header;
