import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, ChevronRight, User } from 'lucide-react';
import { getImageUrl } from '../../services/api';

export default function ProfessionalDashboard() {
    const navigate = useNavigate();
    const firstName = localStorage.getItem('firstName') ?? 'Profesional';

    const cards = [
        {
            title: 'Turnos Asignados',
            description: 'Vea su agenda diaria y gestione las citas de sus pacientes.',
            icon: Calendar,
            color: 'bg-blue-500',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-700',
            path: '/professional/agenda'
        },
        {
            title: 'Mis Horarios',
            description: 'Configure sus días de atención, horarios y bloqueos por vacaciones.',
            icon: Clock,
            color: 'bg-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-700',
            path: '/professional/schedule'
        },
        {
            title: 'Historias Clínicas',
            description: 'Acceda al historial de sus pacientes y registre nuevas evoluciones.',
            icon: BookOpen,
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            path: '/professional/history'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-[90vh] flex flex-col justify-center">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest">Dashboard Profesional</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                        ¡Hola, {firstName}!
                    </h1>
                    <p className="text-slate-500 text-base md:text-lg font-medium max-w-2xl">
                        Bienvenido a tu panel de gestión.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => navigate('/professional/profile')}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-indigo-600 transition-colors">Perfil</span>
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-2xl overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-all">
                        {localStorage.getItem('profilePictureUrl') ? (
                            <img src={getImageUrl(localStorage.getItem('profilePictureUrl')!)} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <User className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => navigate(card.path)}
                            className={`group relative text-left p-6 rounded-[2rem] bg-white border ${card.border} hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300 hover:-translate-y-1.5`}
                        >
                            <div className={`${card.bg} ${card.text} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-12`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                                {card.title}
                            </h2>
                            <p className="text-slate-400 text-sm font-medium leading-normal mb-6">
                                {card.description}
                            </p>

                            <div className={`mt-auto flex items-center gap-1.5 text-sm font-bold ${card.text} tracking-tight`}>
                                Ingresar
                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Decorative element */}
                            <div className={`absolute top-6 right-6 w-1.5 h-1.5 rounded-full ${card.color} opacity-20 group-hover:scale-[6] transition-transform duration-500`}></div>
                        </button>
                    );
                })}
            </div>

            <footer className="mt-10 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wide">© 2026 TurnosPRO • Gestión de Salud</p>
                <div className="flex gap-4">
                    <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors">Soporte</button>
                    <button className="text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors">Manual</button>
                </div>
            </footer>
        </div>
    );
}
