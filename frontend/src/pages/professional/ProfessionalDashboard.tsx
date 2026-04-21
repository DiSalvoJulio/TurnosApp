import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, ChevronRight } from 'lucide-react';

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
        <div className="max-w-6xl mx-auto p-6 md:p-12">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-widest">Dashboard Profesional</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">
                    ¡Hola, {firstName}!
                </h1>
                <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">
                    Bienvenido a tu panel de gestión. Aquí tienes el control total de tu consultorio.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => navigate(card.path)}
                            className={`group relative text-left p-8 rounded-[2.5rem] bg-white border ${card.border} hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-2`}
                        >
                            <div className={`${card.bg} ${card.text} w-16 h-16 rounded-3xl flex items-center justify-center mb-10 transition-transform duration-500 group-hover:rotate-12`}>
                                <Icon className="w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                                {card.title}
                            </h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                {card.description}
                            </p>

                            <div className={`mt-auto flex items-center gap-2 font-bold ${card.text} tracking-tight`}>
                                Ingresar ahora
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Decorative element */}
                            <div className={`absolute top-8 right-8 w-2 h-2 rounded-full ${card.color} opacity-20 group-hover:scale-[8] transition-transform duration-500`}></div>
                        </button>
                    );
                })}
            </div>

            <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-400 font-bold text-sm">© 2026 TurnosPRO • Sistema de Gestión de Salud</p>
                <div className="flex gap-6">
                    <button className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors">Soporte Técnico</button>
                    <button className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors">Manual de Uso</button>
                </div>
            </footer>
        </div>
    );
}
