import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingCart, User, ChevronDown, LogOut, Package, Settings, LayoutDashboard } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { href: "#menu", label: "Menu" },
  { href: "#deals", label: "Deals" },
  { href: "#gallery", label: "Gallery" },
  { href: "#find-us", label: "Find Us" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-secondary/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group">
          <span className="text-3xl sm:text-4xl font-display text-accent tracking-wider drop-shadow-[2px_2px_0_oklch(0.15_0.02_30)]">
            MUNCHIZ
          </span>
          <span className="text-xl animate-wiggle">🍔</span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-primary-foreground font-semibold uppercase text-sm tracking-wide hover:text-accent transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <button
              onClick={() => setIsOpen(true)}
              className="relative text-primary-foreground hover:text-accent transition-colors p-2"
              aria-label="Open cart"
            >
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </li>
          <li>
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-primary-foreground hover:text-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {(profile?.full_name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold hidden lg:block max-w-[120px] truncate">
                    {profile?.full_name || "Account"}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-1 z-50">
                    <Link
                      to="/my-orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary hover:bg-muted transition-colors"
                    >
                      <Package size={16} />
                      My Orders
                    </Link>
                    <Link
                      to="/my-account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-secondary hover:bg-muted transition-colors"
                    >
                      <Settings size={16} />
                      My Account
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-muted transition-colors font-semibold"
                      >
                        <LayoutDashboard size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { setDropdownOpen(false); signOut(); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors w-full"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="text-primary-foreground hover:text-accent transition-colors text-sm font-semibold flex items-center gap-1"
              >
                <User size={18} />
                Sign In
              </Link>
            )}
          </li>
          <li>
            <a
              href="#menu"
              className="bg-accent text-accent-foreground px-5 py-2 rounded-full font-bold uppercase text-sm tracking-wide hover:scale-105 transition-transform shadow-card-warm"
            >
              Order Now
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="relative text-primary-foreground p-2"
            aria-label="Open cart"
          >
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          {user ? (
            <Link to="/my-account" className="text-primary-foreground p-2">
              <User size={24} />
            </Link>
          ) : (
            <Link to="/sign-in" className="text-primary-foreground p-2">
              <User size={24} />
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-primary-foreground p-2"
            aria-label="Toggle menu"
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-secondary border-t border-secondary-foreground/10">
          <ul className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block text-primary-foreground font-semibold uppercase tracking-wide py-2"
                >
                  {l.label}
                </a>
              </li>
            ))}
            {user && (
              <>
                <li>
                  <Link
                    to="/my-orders"
                    onClick={() => setOpen(false)}
                    className="block text-primary-foreground font-semibold uppercase tracking-wide py-2"
                  >
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-account"
                    onClick={() => setOpen(false)}
                    className="block text-primary-foreground font-semibold uppercase tracking-wide py-2"
                  >
                    My Account
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="block text-amber-400 font-semibold uppercase tracking-wide py-2"
                    >
                      Admin Panel
                    </Link>
                  </li>
                )}
              </>
            )}
            <li>
              <a
                href="#menu"
                onClick={() => setOpen(false)}
                className="block bg-accent text-accent-foreground px-5 py-3 rounded-full font-bold uppercase text-center"
              >
                Order Now
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
