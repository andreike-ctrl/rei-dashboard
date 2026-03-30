import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Building2, Users, ClipboardEdit, FileText, LogOut, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { to: "/", label: "Properties", icon: Building2 },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/data-input", label: "Data Input", icon: ClipboardEdit },
];

const reportItems = [
  { to: "/report", label: "Property Report" },
  { to: "/nav-report", label: "NAV Report" },
];

export function Layout() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const reportActive = reportItems.some((r) => location.pathname.startsWith(r.to));

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (reportRef.current && !reportRef.current.contains(e.target as Node)) {
        setReportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <img src="/vo2-logo.png" alt="VO2 Alternatives" className="h-6 w-auto object-contain" />
            <span className="hidden sm:inline">RE Dashboard</span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-auto hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            {/* Reports dropdown */}
            <div className="relative" ref={reportRef}>
              <button
                onClick={() => setReportOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  reportActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <FileText className="h-4 w-4" />
                Reports
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", reportOpen && "rotate-180")} />
              </button>
              {reportOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-border bg-background shadow-md py-1 z-50">
                  {reportItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setReportOpen(false)}
                      className={cn(
                        "block px-4 py-2 text-sm transition-colors",
                        location.pathname.startsWith(item.to)
                          ? "bg-secondary text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop sign out */}
          <button
            onClick={signOut}
            className="hidden sm:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="ml-auto sm:hidden rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            {reportItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors pl-9",
                  location.pathname.startsWith(item.to)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => { setMobileOpen(false); signOut(); }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
