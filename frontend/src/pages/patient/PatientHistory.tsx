import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { History as HistoryIcon, Calendar, Edit, XCircle, ChevronLeft, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';

interface Appointment {
    id: string;
    professionalId: string;
    professionalName: string;
    professionalSpecialty: string;
    appointmentDate: string;
    startTime: string;
    status: string;
}

export default function PatientHistory() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const patientId = localStorage.getItem('profileId');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/appointments/patient/${patientId}`);
            if (Array.isArray(data)) {
                const upcoming = data.filter((a: Appointment) => {
                    // Solo mostramos los turnos "vivos" (agendados/confirmados) que sean para hoy o futuro
                    if (a.status === 'CANCELLED' || a.status === 'COMPLETED' || a.status === 'RESCHEDULED') return false;
                    try {
                        const datePart = a.appointmentDate.split('T')[0];
                        const appDate = startOfDay(parseISO(datePart));
                        const today = startOfDay(new Date());
                        return appDate >= today;
                    } catch {
                        return false;
                    }
                });
                const sorted = upcoming.sort((a: Appointment, b: Appointment) => {
                    try {
                        const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
                        const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
                        return dateB - dateA;
                    } catch { return 0; }
                });
                setAppointments(sorted);
            } else {
                setAppointments([]);
            }
        } catch (error) {
            console.error("Error fetching patient history:", error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: 'Desea cancelar este turno',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/appointments/${id}/cancel`);
            fetchAppointments();
            Swal.fire({
                title: 'Cancelado',
                text: 'El turno ha sido cancelado con éxito.',
                icon: 'success',
                confirmButtonColor: '#10b981'
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al cancelar el turno',
                icon: 'error',
                confirmButtonColor: '#10b981'
            });
        }
    };

    const handleEdit = async (app: Appointment) => {
        const result = await Swal.fire({
            title: '¿Desea reprogramar?',
            text: 'El turno actual se mantendrá hasta que confirme el nuevo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, reprogramar',
            cancelButtonText: 'No, volver'
        });

        if (result.isConfirmed) {
            // Pasamos los datos del profesional para pre-seleccionarlos en el buscador
            navigate('/patient/book', {
                state: {
                    professionalId: app.professionalId,
                    professionalName: app.professionalName,
                    appointmentIdToCancel: app.id
                }
            });
        }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            CANCELLED: 'bg-red-100 text-red-700 border-red-200',
            COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
            SCHEDULED: 'bg-teal-100 text-teal-700 border-teal-200',
            RESCHEDULED: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        const labels: Record<string, string> = {
            CONFIRMED: 'Confirmado',
            CANCELLED: 'Cancelado',
            COMPLETED: 'Completado',
            SCHEDULED: 'Agendado',
            RESCHEDULED: 'Reprogramado',
        };
        return (
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {labels[status] ?? status}
            </span>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-24">
            <header className="mb-12">
                <button onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Inicio
                </button>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                        <HistoryIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Mis Turnos</h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Historial y gestión de citas</p>
                    </div>
                </div>
            </header>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando turnos...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 md:p-16 text-center border border-slate-100 shadow-sm shadow-slate-100/50">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <HistoryIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 tracking-tight">No tenés turnos registrados</h2>
                        <p className="text-slate-500 font-medium mb-8 sm:mb-10 max-w-xs mx-auto text-sm sm:text-base">Todavía no has realizado ninguna reserva en el sistema.</p>
                        <Button
                            onClick={() => navigate('/patient/book')}
                            className="rounded-2xl px-6 sm:px-10 py-4 sm:py-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg sm:shadow-xl shadow-emerald-100 whitespace-normal h-auto w-full sm:w-auto"
                        >
                            Solicitar mi primer turno
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map(app => {
                            let dateStr = 'Fecha no disponible';
                            let time = '--:--';
                            let isUpcoming = false;

                            try {
                                if (app.appointmentDate) {
                                    dateStr = format(parseISO(app.appointmentDate), "EEEE d 'de' MMMM", { locale: es });
                                    // Evaluar si es próximo de forma segura
                                    // Extraemos solo la fecha (YYYY-MM-DD) para ignorar desfases horarios/zonas horarias
                                    const datePart = app.appointmentDate.split('T')[0];
                                    const appointmentDate = startOfDay(parseISO(datePart));
                                    const today = startOfDay(new Date());

                                    const status = app.status?.toUpperCase();
                                    // Es próximo si no está cancelado/completado/reprogramado Y es hoy o en el futuro
                                    isUpcoming = (status !== 'CANCELLED' && status !== 'COMPLETED' && status !== 'RESCHEDULED') &&
                                        (appointmentDate >= today);
                                }
                                if (app.startTime) {
                                    time = app.startTime.substring(0, 5);
                                }
                            } catch (e) {
                                console.error("Error formatting date in history:", e);
                            }

                            return (
                                <div key={app.id} className={`group bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-50 hover:border-emerald-100 ${app.status === 'CANCELLED' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <div className="mb-4 flex justify-between items-start">
                                        {statusBadge(app.status)}
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto min-w-0">
                                            <div className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${isUpcoming ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                                                    <p className="font-black text-slate-900 text-lg sm:text-xl leading-none truncate">{app.professionalName || 'Profesional no asignado'}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="hidden sm:inline text-slate-300">•</span>
                                                        <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md self-start sm:self-auto">{app.professionalSpecialty}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center mt-2 sm:mt-3 min-w-0">
                                                    <div className="text-slate-500 font-bold text-xs sm:text-sm capitalize flex items-start sm:items-center gap-2">
                                                        <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                                                        <span className="break-words whitespace-normal leading-tight">{dateStr} — {time} hs</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isUpcoming && (
                                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleEdit(app)}
                                                    className="w-full sm:w-auto rounded-2xl px-6 h-14 font-black text-slate-700 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center"
                                                    title="Reprogramar turno"
                                                >
                                                    <Edit className="w-5 h-5 mr-2" />
                                                    Reprogramar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleCancel(app.id)}
                                                    className="w-full sm:w-auto rounded-2xl px-6 h-14 font-black transition-all active:scale-95 shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                                                    title="Cancelar turno"
                                                >
                                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                                    <span>Cancelar</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {isUpcoming && (
                                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-3 text-emerald-700/60 font-bold text-xs uppercase tracking-widest">
                                            <AlertCircle className="w-4 h-4" />
                                            Cualquier cambio debe realizarse con antelación
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
