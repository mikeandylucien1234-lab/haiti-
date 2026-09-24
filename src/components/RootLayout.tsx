import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path
        d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C15 15.65 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BagIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Accueil", icon: HomeIcon },
  { to: "/favoris", label: "Favoris", icon: HeartIcon },
  { to: "/panier", label: "Panier", icon: BagIcon },
  { to: "/mes-commandes", label: "Profil", icon: UserIcon },
] as const;

export default function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-dvh bg-brand-cream">
        <Outlet />
      </div>
    );
  }

  const showNav = ["/", "/mes-commandes", "/favoris"].includes(pathname);

  return (
    <div className="app-shell shadow-xl">
      <main className={`flex-1 ${showNav ? "pb-24" : ""}`}>
        <Outlet />
      </main>
      {showNav && (
        <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] bg-white border-t border-brand-cream-3 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around z-30">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            const isCart = label === "Panier";
            return (
              <Link
                key={label}
                to={to}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                  active ? "bg-brand-green text-white" : "text-brand-sage"
                }`}
              >
                <span className="relative">
                  <Icon active={active} />
                  {isCart && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-brand-gold text-brand-green-dark text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </span>
                {active && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
