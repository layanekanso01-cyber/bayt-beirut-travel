import { Link, useLocation } from "wouter";
import { Search, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/nearby", label: "Nearby" },
    { href: "/trip-planner", label: "Planner" },
    { href: "/smart-itinerary", label: "Itinerary" },
    { href: "/favorites", label: "Favorites" },
    { href: "/transport", label: "Transport" },
    { href: "/bookings", label: "My Trips" },
    { href: "/account", label: "Account" },
    ...(isAdmin
      ? [
          { href: "/admin/dashboard", label: "Admin" },
          { href: "/admin-newsletter", label: "Newsletter" },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md">
      <div className="lebanon-flag-ribbon absolute inset-x-0 top-0 h-1.5" />
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-primary">
          <img
            src="/lebanon-logo.png"
            alt="Bayt Beirut Travel logo"
            className="h-14 w-14 rounded-2xl object-cover shadow-sm ring-1 ring-primary/20"
          />
          <span className="leading-none">
            <span className="block font-serif text-2xl font-bold tracking-tight">Bayt Beirut</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
              Travel
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Search className="w-5 h-5 text-foreground" />
          </Button>
          <Link href="/">
            <Button
              className="rounded-full bg-primary px-6 font-medium text-white hover:bg-primary/90"
              onClick={(event) => {
                if (user) {
                  event.preventDefault();
                  logout();
                }
              }}
            >
              {user ? "Logout" : "Sign In"}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col gap-8 mt-10">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`text-xl font-serif font-medium ${
                      location === link.href ? "text-primary" : "text-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-4 mt-auto">
                 <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                   <Button
                     className="w-full rounded-full"
                     size="lg"
                     onClick={(event) => {
                       if (user) {
                         event.preventDefault();
                         logout();
                       }
                     }}
                   >
                     {user ? "Logout" : "Sign In"}
                   </Button>
                 </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  async function handleNewsletterSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      if (!response.ok) {
        throw new Error("Could not subscribe");
      }

      const savedEmails = JSON.parse(localStorage.getItem("newsletterSubscribers") || "[]") as string[];
      const nextEmails = Array.from(new Set([...savedEmails, newsletterEmail.trim().toLowerCase()]));
      localStorage.setItem("newsletterSubscribers", JSON.stringify(nextEmails));
      setNewsletterStatus("Subscribed successfully. You can send newsletters from Admin.");
      setNewsletterEmail("");
    } catch {
      const savedEmails = JSON.parse(localStorage.getItem("newsletterSubscribers") || "[]") as string[];
      const nextEmails = Array.from(new Set([...savedEmails, newsletterEmail.trim().toLowerCase()]));
      localStorage.setItem("newsletterSubscribers", JSON.stringify(nextEmails));
      setNewsletterStatus("Saved locally. Start the backend to sync subscribers.");
      setNewsletterEmail("");
    }
  }

  return (
    <footer className="bg-muted/30 border-t border-border mt-20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <img
                src="/lebanon-logo.png"
                alt="Bayt Beirut Travel logo"
                className="h-11 w-11 rounded-xl object-cover ring-1 ring-primary/20"
              />
              <h3 className="font-serif text-xl font-bold">Bayt Beirut Travel</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Discover the pearl of the Middle East. From the ancient ruins of Baalbek to the vibrant nightlife of Beirut.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Regions</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Historical Sites</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Dining</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Shopping</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Newsletter</h4>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <Button size="sm" type="submit">Join</Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              {newsletterStatus || "Subscribe for Bayt Beirut travel updates."}
            </p>
            {newsletterStatus && isAdmin && (
              <Link href="/admin-newsletter" className="mt-2 block text-xs font-medium text-primary hover:underline">
                Open newsletter admin
              </Link>
            )}
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-6 text-center text-sm text-muted-foreground">
          © 2025 Bayt Beirut Travel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

