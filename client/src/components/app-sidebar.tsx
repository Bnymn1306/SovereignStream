import { useLocation, Link } from "wouter";
import { Home, Upload, LayoutDashboard, ShoppingBag, Circle, LogOut, Wallet, BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useWallet } from "@/components/wallet-context";

const navItems = [
  { title: "Discover", url: "/", icon: Home },
  { title: "Creator Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Upload Content", url: "/upload", icon: Upload },
  { title: "My Library", url: "/library", icon: ShoppingBag },
  { title: "How to Use", url: "/how-to-use", icon: BookOpen },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { connected, address, walletName, disconnect, connect } = useWallet();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-2.5">
            <img src="/logo_128.png" alt="SovereignStream" className="w-9 h-9 rounded-full object-cover shadow-md" />
            <div>
              <h1 className="text-sm font-bold tracking-tight">SovereignStream</h1>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider">SHELBY PROTOCOL</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-colors duration-200"
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {connected ? (
          <div className="glass-panel rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              {walletName && (
                <div className="flex items-center gap-1.5">
                  <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
                  <span className="text-xs font-medium text-foreground/80">{walletName}</span>
                </div>
              )}
              <button
                onClick={disconnect}
                data-testid="button-sidebar-disconnect"
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                title="Disconnect wallet"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono truncate" data-testid="text-wallet-address">
              {address?.slice(0, 8)}...{address?.slice(-6)}
            </p>
          </div>
        ) : (
          <button
            onClick={connect}
            data-testid="button-sidebar-connect"
            className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg gradient-primary text-white text-sm font-medium cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
