import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Wallet,
  Upload,
  Eye,
  ShoppingBag,
  LayoutDashboard,
  Globe,
  Shield,
  ArrowRight,
  FileVideo,
  FileText,
  Coins,
  ExternalLink,
  CheckCircle2,
  Download,
} from "lucide-react";

export default function HowToUse() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-guide-title">
                How to Use SovereignStream
              </h1>
              <p className="text-sm text-muted-foreground font-mono">Powered by Shelby Protocol</p>
            </div>
          </div>
        </div>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-about">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            What is SovereignStream?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SovereignStream is a <strong className="text-foreground">decentralized pay-per-read/view content platform</strong> built 
            on the Shelby Protocol. It enables content creators to upload videos and PDF documents, set their own prices in ShelbyUSD 
            (a stablecoin on the Aptos blockchain), and earn directly from viewers through on-chain micropayments — with no middlemen, no platform fees 
            deducted by centralized services, and full ownership of your content.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All uploaded files are stored on <strong className="text-foreground">ShelbyNet</strong>, a high-performance 
            decentralized blob storage network built on the Aptos blockchain. Content is automatically fragmented using 
            Clay Codes (erasure coding) and distributed across storage providers for redundancy, censorship resistance, 
            and sub-second retrieval from hot storage.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium">Decentralized & Censorship-Resistant</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Coins className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium">Direct Creator Payments via ShelbyUSD</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium">Sub-Second Content Delivery</span>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-prerequisites">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Prerequisites
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Before you start using SovereignStream, make sure you have the following:
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <Badge className="gradient-primary text-white border-0 mt-0.5 text-[10px] px-2">1</Badge>
              <div>
                <p className="text-sm font-medium">Install Petra Wallet or Martian Wallet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download the <a href="https://petra.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Petra Wallet</a> or <a href="https://martianwallet.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Martian Wallet</a> browser 
                  extension. These are Aptos-compatible wallets that allow you to sign transactions and manage your APT and ShelbyUSD tokens.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Badge className="gradient-primary text-white border-0 mt-0.5 text-[10px] px-2">2</Badge>
              <div>
                <p className="text-sm font-medium">Create a Wallet & Get ShelbyUSD Tokens</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a new wallet in Petra or Martian. Make sure your wallet is connected to the <strong>ShelbyNet</strong> network 
                  (or Aptos Testnet). You'll need ShelbyUSD tokens to purchase content and APT for gas fees. For testnet, you can get free tokens from the 
                  <a href="https://faucet.shelbynet.shelby.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Shelby Faucet</a>.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Badge className="gradient-primary text-white border-0 mt-0.5 text-[10px] px-2">3</Badge>
              <div>
                <p className="text-sm font-medium">Switch to the Correct Network</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  In your wallet settings, make sure you are on the <strong>ShelbyNet</strong> network. If you see a network warning 
                  in the app, switch your wallet's network accordingly. The platform supports ShelbyNet and Aptos Testnet.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-connect-wallet">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Step 1: Connect Your Wallet
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To interact with SovereignStream, you need to connect your Aptos-compatible wallet.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Click the <strong className="text-foreground">"Connect Wallet"</strong> button in the top-right corner of the header, 
                  or in the sidebar at the bottom.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  A dialog will appear showing available wallets (Petra, Martian). Click on your installed wallet.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Your wallet extension will prompt you to approve the connection. Click <strong className="text-foreground">"Connect"</strong> in the wallet popup.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Once connected, your wallet address will appear in the header (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded">0x90BB...96CC</code>) 
                  and in the sidebar footer with a green dot indicating active connection.
                </p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2">
              <p className="text-xs text-amber-400">
                <strong>Note:</strong> You can disconnect at any time by clicking the logout icon next to your address 
                in the header or sidebar. You must reconnect manually each session (auto-connect is disabled for security).
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-discover">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Step 2: Discover Content
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The <strong className="text-foreground">Discover</strong> page is the main marketplace where all published content 
              is listed. Here you can browse, search, and filter content.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Navigate to <strong className="text-foreground">"Discover"</strong> from the sidebar (it's the home page).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Use the <strong className="text-foreground">search bar</strong> at the top to find specific content by title or description.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Use the <strong className="text-foreground">filter badges</strong> (All, Videos, PDFs) to filter by content type.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Each content card shows: title, creator name, price in ShelbyUSD, view count, total earnings, and a 
                  <span className="text-emerald-400 font-mono text-xs ml-1">⚡ Shelby</span> badge indicating decentralized storage.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Click on any content card to open the <strong className="text-foreground">Content Viewer</strong> page.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-purchase">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Step 3: Purchase & View Content
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To access premium content, you need to make an on-chain micropayment using your connected wallet.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Open a content item from the Discover page. You'll see the content details: title, description, 
                  creator info, price, and the Shelby Blob ID.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  If you haven't purchased this content yet, you'll see a <strong className="text-foreground">"Pay X ShelbyUSD to Unlock"</strong> button 
                  overlaid on the content preview.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Click the pay button. Your wallet will prompt you to confirm the transaction. The payment goes 
                  <strong className="text-foreground"> directly to the creator's wallet address</strong> — no intermediary.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  The platform verifies the transaction on-chain (sender, recipient, amount). Once confirmed, 
                  you get instant access to the content.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  The content stream loads from Shelby hot storage with real-time fragment progress. 
                  You'll see latency metrics and a <span className="text-emerald-400 font-mono text-xs">"Streamed in Xms via Shelby"</span> badge.
                </p>
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mt-2">
              <p className="text-xs text-emerald-400">
                <strong>Once purchased, you have permanent access.</strong> Your purchased content will appear 
                in your "My Library" section, accessible anytime with the same wallet.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-upload">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Step 4: Upload Content (For Creators)
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you're a content creator, you can upload videos and PDF documents to the platform and earn ShelbyUSD 
              from every purchase.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Make sure your wallet is connected. Navigate to <strong className="text-foreground">"Upload Content"</strong> from the sidebar.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Fill in the form: <strong className="text-foreground">Creator Name</strong> (your display name), 
                  <strong className="text-foreground"> Title</strong>, <strong className="text-foreground">Description</strong> (optional), 
                  and <strong className="text-foreground">Content Type</strong> (Video or PDF).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Upload your file</strong> by clicking the drop zone or dragging your file into it. 
                  Supported formats: MP4, WebM, MOV, AVI, MKV (video) and PDF (documents). Maximum file size: 100 MB.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Your file is uploaded to <strong className="text-foreground">ShelbyNet</strong> in real-time. 
                  It's fragmented using Clay Codes and distributed across storage providers. You'll see a confirmation 
                  with the blob name and a <strong className="text-foreground">"View on Shelby Explorer"</strong> link.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Set your <strong className="text-foreground">price in ShelbyUSD</strong> (e.g., 0.1 ShelbyUSD, 0.5 ShelbyUSD). 
                  This is the amount users will pay to unlock your content.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Click <strong className="text-foreground">"Publish Content"</strong>. Your content will be live on the 
                  Discover marketplace immediately.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mt-2">
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">MP4, WebM, MOV, AVI, MKV</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">PDF</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <span className="text-xs text-muted-foreground">Max 100 MB</span>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-library">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Step 5: My Library
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content you've purchased is saved in your personal library for easy access.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Navigate to <strong className="text-foreground">"My Library"</strong> from the sidebar.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  You'll see all your purchased content with purchase date and transaction hash. 
                  Click any item to re-access the content instantly without paying again.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Your library is tied to your wallet address. Connect the same wallet to access your purchases 
                  from any device or browser.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-dashboard">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Step 6: Creator Dashboard
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you've uploaded content, the Creator Dashboard gives you a full overview of your performance.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Navigate to <strong className="text-foreground">"Creator Dashboard"</strong> from the sidebar.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  View your total earnings in ShelbyUSD, total views across all content, and the number of published items.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  See individual content performance: each item's view count, earnings, price, and Shelby Blob ID.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-shelby-explorer">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Shelby Explorer
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every file uploaded through SovereignStream is stored on the real ShelbyNet decentralized storage 
              network. You can verify your uploads on the Shelby Explorer.
            </p>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  After uploading, click the <strong className="text-foreground">"View on Shelby Explorer"</strong> link 
                  to see your blob registered on-chain.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  The explorer shows: blob type (Registered), transaction hash, owner address, blob name, and timestamp.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Explorer URL: <a href="https://explorer.shelby.xyz/shelbynet" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs">explorer.shelby.xyz/shelbynet</a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4" data-testid="section-faq">
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">What tokens do I need?</p>
              <p className="text-xs text-muted-foreground mt-1">
                You need ShelbyUSD tokens in your wallet to purchase content, and APT for gas fees. For the ShelbyNet testnet, you can get 
                free tokens from the Shelby Faucet. Creators receive ShelbyUSD directly when users purchase their content.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Is my payment secure?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Yes. All payments are executed as on-chain transactions on the Aptos blockchain. The platform verifies 
                every transaction by checking the sender, recipient, and amount directly on-chain before granting access. 
                No funds are held by the platform.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Can I access purchased content from another device?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Yes. Your purchases are linked to your wallet address, not your device. As long as you connect the same 
                wallet, you can access your library from any browser or device.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">What happens to my uploaded files?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Uploaded files are stored on ShelbyNet's decentralized storage network. They are fragmented using Clay Codes 
                (erasure coding) for redundancy and distributed across multiple storage providers. Files are stored for 30 days 
                on testnet. You can verify storage on the Shelby Explorer.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Which wallets are supported?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Currently, SovereignStream supports <strong>Petra Wallet</strong> and <strong>Martian Wallet</strong>. 
                Both are available as browser extensions for Chrome, Brave, Firefox, and Edge.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">What file types can I upload?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Videos: MP4, WebM, MOV, AVI, MKV. Documents: PDF. Maximum file size is 100 MB per upload.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            SovereignStream v1.0 — Built on Shelby Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
