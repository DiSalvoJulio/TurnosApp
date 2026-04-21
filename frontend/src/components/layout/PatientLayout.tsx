import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, LogOut, ChevronDown, Calendar, History, LayoutDashboard } from 'lucide-react';

interface PatientLayoutProps {
    children: React.ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const firstName = localStorage.getItem('firstName') ?? 'Paciente';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { label: 'Inicio', icon: LayoutDashboard, path: '/patient/dashboard' },
        { label: 'Reservar Turno', icon: Calendar, path: '/patient/book' },
        { label: 'Mis Turnos', icon: History, path: '/patient/history' },
        { label: 'Historial Turnos', icon: History, path: '/patient/history-turnos' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-emerald-50/80 backdrop-blur-xl border-b border-emerald-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-emerald-500/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tight hidden md:block">TurnosApp</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-700'
                                        : 'text-slate-500 hover:bg-white/50 hover:text-emerald-600'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right mr-2">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">¡Hola!</p>
                        <h1 className="text-sm font-black text-slate-900 leading-none mt-0.5">{firstName}</h1>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100 hover:border-slate-200"
                        >
                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                                <User className="w-6 h-6 text-slate-400" />
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
                                <div className="px-4 py-3 border-b border-slate-50 mb-1 lg:hidden">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paciente</p>
                                    <p className="font-bold text-slate-800">{firstName}</p>
                                </div>
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex lg:hidden items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
                                        >
                                            <Icon className="w-5 h-5 text-slate-400" /> {item.label}
                                        </Link>
                                    );
                                })}
                                <Link
                                    to="/patient/profile"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
                                >
                                    <User className="w-5 h-5 text-slate-400" /> Mi Perfil
                                </Link>
                                <div className="border-t border-slate-50 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-bold text-sm"
                                >
                                    <LogOut className="w-5 h-5" /> Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Content area */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
