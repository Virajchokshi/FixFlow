import { useNavigate, Link } from 'react-router-dom';
import { User, HardHat, ChevronRight } from 'lucide-react';

const ROLES = [
  {
    label: 'Resident / User',
    description: 'Submit and track maintenance requests for your space.',
    icon: User,
    href: '/register/user',
    color: 'bg-blue-50 text-blue-600',
    border: 'hover:border-blue-400',
  },
  {
    label: 'Technician',
    description: 'Manage assigned work orders and resolve maintenance issues.',
    icon: HardHat,
    href: '/register/technician',
    color: 'bg-amber-50 text-amber-600',
    border: 'hover:border-amber-400',
  },
] as const;

export function RegisterLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src="/logo.png" alt="FixFlow" className="h-28 w-auto object-contain" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white">Create your account</h2>
          <p className="text-sm text-slate-400 mt-1">Choose your role to get started</p>
        </div>

        <div className="space-y-3">
          {ROLES.map(({ label, description, icon: Icon, href, color, border }) => (
            <button
              key={href}
              onClick={() => navigate(href)}
              className={`w-full flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/60 p-5 text-left transition-colors ${border} hover:bg-slate-800`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-fixflow-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
