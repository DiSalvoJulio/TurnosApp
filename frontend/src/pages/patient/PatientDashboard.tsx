import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { CalendarDays, User, PlusCircle, ChevronRight, Calendar, Clock } from 'lucide-react';


interface Appointment {
    id: string;
    professionalId: string;
    professionalName: string;
    appointmentDate: string;
    startTime: string;
    status: string;
}

export default function PatientDashboard() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const patientId = localStorage.getItem('profileId');
    const firstName = localStorage.getItem('firstName') ?? 'Paciente';

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/appointments/patient/${patientId}`);
            setAppointments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const upcoming = appointments.filter(a => {
        try {
            return a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && a.appointmentDate && (isFuture(parseISO(a.appointmentDate)) || format(new Date(), 'yyyy-MM-dd') === a.appointmentDate.split('T')[0]);
        } catch (e) {
            return false;
        }
    }).sort((a, b) => {
        try {
            return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
        } catch (e) {
            return 0;
        }
    });

    const cards = [
        {
            title: 'Reservar Turno',
            description: 'Encuentre profesionales y agende su próxima cita hoy mismo.',
            icon: PlusCircle,
            color: 'bg-blue-500',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-700',
            path: '/patient/book'
        },
        {
            title: 'Mis Turnos',
            description: 'Revise su historial de citas y gestione sus próximos encuentros.',
            icon: Clock,
            color: 'bg-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-700',
            path: '/patient/history'
        },
        {
            title: 'Mi Perfil',
            description: 'Mantenga sus datos personales y preferencias siempre al día.',
            icon: User,
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            path: '/patient/profile'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-widest">Panel del Paciente</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">
                    ¡Hola, {firstName}!
                </h1>
                <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">
                    Bienvenido a tu salud centralizada. Gestioná tus turnos con total facilidad.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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

                            <div className={`absolute top-8 right-8 w-2 h-2 rounded-full ${card.color} opacity-20 group-hover:scale-[8] transition-transform duration-500`}></div>
                        </button>
                    );
                })}
            </div>

            {/* Upcoming Appointments */}
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <Calendar className="w-8 h-8 text-emerald-600" /> Próximos Turnos
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div></div>
                ) : upcoming.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <CalendarDays className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 font-bold text-lg tracking-tight">No tienes turnos programados</p>
                        <button onClick={() => navigate('/patient/book')} className="mt-4 text-emerald-600 font-black hover:underline">
                            Reservar un turno ahora
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcoming.map(app => {
                            let dateStr = 'Fecha no disponible';
                            let time = '--:--';
                            try {
                                if (app.appointmentDate) {
                                    dateStr = format(parseISO(app.appointmentDate), "EEEE d 'de' MMMM", { locale: es });
                                }
                                if (app.startTime) {
                                    time = app.startTime.substring(0, 5);
                                }
                            } catch (e) {
                                console.error("Error formatting date in dashboard:", e);
                            }
                            return (
                                <button key={app.id} onClick={() => navigate('/patient/history')} className="w-full text-left group bg-slate-50 hover:bg-white rounded-3xl p-4 sm:p-6 border border-transparent hover:border-emerald-100 transition-all flex items-center justify-between gap-2 sm:gap-4 hover:shadow-lg hover:shadow-emerald-50 min-w-0">
                                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                            <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8" />
                                        </div>
                                        <div className="min-w-0 flex-1 py-1">
                                            <p className="font-black text-slate-900 text-base sm:text-lg leading-tight mb-1 truncate">{app.professionalName}</p>
                                            <p className="text-slate-500 font-bold text-xs sm:text-sm capitalize break-words whitespace-normal leading-tight">{dateStr} — {time} hs</p>
                                        </div>
                                    </div>
                                    <div className="p-1 sm:p-3 flex-shrink-0 rounded-2xl text-emerald-300 group-hover:text-emerald-600 transition-all sm:opacity-0 group-hover:opacity-100 group-hover:translate-x-1">
                                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-400 font-bold text-sm">© 2026 TurnosApp • Tu salud en buenas manos</p>
                <div className="flex gap-6">
                    <button className="text-slate-400 hover:text-emerald-600 font-bold text-sm transition-colors">Ayuda</button>
                    <button className="text-slate-400 hover:text-emerald-600 font-bold text-sm transition-colors">Términos y condiciones</button>
                </div>
            </footer>
        </div>
    );
}
