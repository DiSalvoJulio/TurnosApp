import { Link } from 'react-router-dom';
import { Users, UserSquare2, Stethoscope, CalendarDays, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
    const cards = [
        { 
            title: 'Profesionales', 
            desc: 'Gestionar nómina de médicos y especialistas', 
            path: '/admin/professionals', 
            icon: Stethoscope,
            color: 'from-blue-500 to-blue-700',
            shadow: 'shadow-blue-100'
        },
        { 
            title: 'Pacientes', 
            desc: 'Administrar base de datos de pacientes', 
            path: '/admin/patients', 
            icon: Users,
            color: 'from-emerald-500 to-emerald-700',
            shadow: 'shadow-emerald-100'
        },
        { 
            title: 'Especialidades', 
            desc: 'Configurar ramas médicas y categorías', 
            path: '/admin/professions', 
            icon: UserSquare2,
            color: 'from-indigo-500 to-indigo-700',
            shadow: 'shadow-indigo-100'
        },
        { 
            title: 'Agenda General', 
            desc: 'Cronograma completo de turnos del centro', 
            path: '/admin/agenda', 
            icon: CalendarDays,
            color: 'from-amber-500 to-amber-700',
            shadow: 'shadow-amber-100'
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <header className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
                <p className="text-slate-500 font-medium mt-2 text-lg">Bienvenido al centro de gestión global. Seleccione un módulo para comenzar.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <Link 
                            key={idx} 
                            to={card.path} 
                            className={`group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 animate-in fade-in zoom-in-95 duration-500`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className={`w-16 h-16 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl ${card.shadow} transition-transform group-hover:scale-110`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{card.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6">{card.desc}</p>
                            
                            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">
                                Acceder <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>

                            {/* Subtle decorative circle */}
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick stats or info bar */}
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight mb-2">Resumen de Operaciones</h2>
                        <p className="text-slate-400 font-medium max-w-md">El sistema está funcionando correctamente. Los cambios realizados se verán reflejados instantáneamente en los portales de pacientes y profesionales.</p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
            </div>
        </div>
    );
}

