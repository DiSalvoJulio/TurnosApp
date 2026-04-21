import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Users, Calendar } from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const firstName = localStorage.getItem('firstName') ?? 'Admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const navItems = [
        { label: 'Panel Admin', icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Gestionar Profesionales', icon: Users, path: '/admin/professionals' },
        { label: 'Gestionar Especialidades', icon: LayoutDashboard, path: '/admin/professions' },
        { label: 'Gestionar Pacientes', icon: Users, path: '/admin/patients' },
        { label: 'Agenda General', icon: Calendar, path: '/admin/agenda' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-indigo-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><LayoutDashboard className="w-5 h-5" /></div>
                    <div className="font-black text-lg">Admin Turnos</div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        <p className="text-xs uppercase tracking-widest text-indigo-100">Administrador</p>
                        <p className="font-bold">{firstName}</p>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setOpen(!open)} className="p-2 rounded-md bg-white/20 hover:bg-white/30"><User className="w-5 h-5" /></button>
                        {open && (
                            <div className="absolute right-0 mt-2 w-48 bg-white text-slate-700 rounded-xl shadow-lg border border-slate-100">
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center gap-2"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <div className="flex flex-1">
                <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden md:block">
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path} className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold ${active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                                    <Icon className="w-4 h-4" /> {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
