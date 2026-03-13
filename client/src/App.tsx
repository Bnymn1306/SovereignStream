import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { WalletProvider, useWallet } from "@/components/wallet-context";
import { WalletSelector } from "@/components/wallet-selector";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Wallet, LogOut, Circle, Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Discover from "@/pages/discover";
import Dashboard from "@/pages/dashboard";
import UploadPage from "@/pages/upload";
import ContentViewer from "@/pages/content-viewer";
import Library from "@/pages/library";
import HowToUse from "@/pages/how-to-use";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Discover} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/content/:id" component={ContentViewer} />
      <Route path="/library" component={Library} />
      <Route path="/how-to-use" component={HowToUse} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle" className="rounded-full">
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function WalletButton() {
  const { connected, address, walletName, connect, disconnect, isWalletLoading } = useWallet();
  if (isWalletLoading && !connected) {
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-full glass-panel text-sm font-medium text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden sm:inline">Connecting...</span>
      </div>
    );
  }
  if (connected) {
    return (
      <div className="flex items-center gap-2">
        {walletName && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-panel text-xs font-medium">
            <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
            {walletName}
          </div>
        )}
        <span className="text-xs text-muted-foreground font-mono hidden sm:inline" data-testid="text-header-wallet">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button size="icon" variant="ghost" onClick={disconnect} data-testid="button-disconnect" className="rounded-full">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }
  return (
    <button
      onClick={connect}
      data-testid="button-header-connect"
      className="gradient-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
    >
      <Wallet className="w-3.5 h-3.5" />
      Connect Wallet
    </button>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-1 px-3 py-2 border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <WalletButton />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <Router />
          </main>
        </div>
      </div>
      <WalletSelector />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WalletProvider>
            <AppLayout />
            <Toaster />
          </WalletProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
