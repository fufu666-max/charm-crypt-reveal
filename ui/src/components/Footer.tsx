import { Flame } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-16 border-t border-border/50 overflow-hidden">
      {/* Floating Lanterns */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-[10%] floating-animation opacity-60" style={{ animationDelay: '0s' }}>
          <Flame className="h-8 w-8 text-secondary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--amber)))' }} />
        </div>
        <div className="absolute top-8 left-[30%] floating-animation opacity-50" style={{ animationDelay: '1s' }}>
          <Flame className="h-6 w-6 text-secondary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--amber)))' }} />
        </div>
        <div className="absolute top-6 right-[20%] floating-animation opacity-70" style={{ animationDelay: '2s' }}>
          <Flame className="h-7 w-7 text-secondary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--amber)))' }} />
        </div>
        <div className="absolute top-10 right-[45%] floating-animation opacity-40" style={{ animationDelay: '1.5s' }}>
          <Flame className="h-5 w-5 text-secondary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--amber)))' }} />
        </div>
        <div className="absolute top-4 right-[70%] floating-animation opacity-55" style={{ animationDelay: '0.5s' }}>
          <Flame className="h-6 w-6 text-secondary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--amber)))' }} />
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-cinzel font-bold glow-text mb-2">
              MysticRaffle Pavilion
            </h3>
            <p className="font-crimson text-muted-foreground">
              Where cryptographic magic meets fortune
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 font-crimson text-sm text-muted-foreground">
            <a href="#" className="hover:text-secondary transition-colors">About</a>
            <a href="#" className="hover:text-secondary transition-colors">How It Works</a>
            <a href="#" className="hover:text-secondary transition-colors">Terms</a>
            <a href="#" className="hover:text-secondary transition-colors">Support</a>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/30 text-center font-crimson text-sm text-muted-foreground">
          <p>© 2024 MysticRaffle Pavilion. All enchantments reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
