import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { ChevronLeft, CheckCircle2, XCircle, Clock, History as HistoryIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Appointment {
    id: string;
    professionalId: string;
    professionalName: string;
    appointmentDate: string;
    startTime: string;
    status: string;
}

export default function PatientTurnosHistory() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const patientId = localStorage.getItem('profileId');

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/appointments/patient/${patientId}`);
                if (Array.isArray(data)) {
                    const filtered = data.filter((app: Appointment) => {
                        const status = app.status?.toUpperCase() || '';
                        if (status === 'COMPLETED' || status === 'CANCELLED') return true;
                        
                        try {
                            const datePart = app.appointmentDate.split('T')[0];
                            const appDate = new Date(datePart);
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            return appDate < today;
                        } catch {
                            return false;
                        }
                    });
                    const sorted = [...filtered].sort((a, b) => {
                        const da = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
                        const db = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
                        return db - da;
                    });
                    setAppointments(sorted);
                } else {
                    setAppointments([]);
                }
            } catch (error) {
                console.error('Error al cargar historial de turnos:', error);
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [patientId]);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-24">
            <header className="mb-8">
                <button onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Inicio
                </button>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Historial de Turnos</h1>
                        <p className="text-slate-500 font-medium mt-2">Control de los turnos a los que asististe.</p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando historial...</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-10 text-center border border-slate-100 shadow-sm shadow-slate-100/50">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <HistoryIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">No hay historial registrado</h2>
                    <p className="text-slate-500 font-medium mb-6">Una vez que asistas a un turno o se cancele uno, aparecerá aquí el historial.</p>
                    <Button onClick={() => navigate('/patient/book')} className="rounded-2xl px-8 py-3 bg-emerald-600 hover:bg-emerald-700">
                        Agendar un nuevo turno
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map((app) => {
                        let dateStr = 'Fecha no disponible';
                        let time = '--:--';
                        try {
                            dateStr = format(parseISO(app.appointmentDate), "EEEE d 'de' MMMM yyyy", { locale: es });
                            time = app.startTime ? app.startTime.substring(0, 5) : '--:--';
                        } catch {
                            // ignore parse errors
                        }
                        const status = app.status?.toUpperCase() || '';
                        
                        let badgeColor = 'bg-slate-100 text-slate-600';
                        let badgeLabel = status;
                        let Icon = Clock;

                        if (status === 'COMPLETED') {
                            badgeColor = 'bg-emerald-100 text-emerald-700';
                            badgeLabel = 'Asistido';
                            Icon = CheckCircle2;
                        } else if (status === 'CANCELLED') {
                            badgeColor = 'bg-red-100 text-red-700';
                            badgeLabel = 'Cancelado';
                            Icon = XCircle;
                        } else if (status === 'SCHEDULED' || status === 'CONFIRMED') {
                            badgeColor = 'bg-amber-100 text-amber-700';
                            badgeLabel = 'Expirado';
                            Icon = Clock;
                        }

                        return (
                            <div key={app.id} className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div>
                                        <p className="text-slate-700 font-bold text-lg">{app.professionalName || 'Profesional'}</p>
                                        <p className="text-slate-500 text-sm mt-1">{dateStr} • {time} hs</p>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${badgeColor} text-xs font-bold uppercase tracking-wide`}>
                                        <Icon className="w-4 h-4" /> {badgeLabel}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
