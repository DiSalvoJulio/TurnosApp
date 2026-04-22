import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Calendar, Clock, UserIcon, Activity, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Swal from 'sweetalert2';

interface Professional { id: string; firstName: string; lastName: string; specialty: string; }

export default function BookAppointment() {
    const location = useLocation();
    const navigate = useNavigate();

    // Recuperar datos de reprogramación si vienen del historial
    const editState = location.state as { professionalId?: string, professionalName?: string, appointmentIdToCancel?: string } | null;

    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedProf, setSelectedProf] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [worksSaturdays, setWorksSaturdays] = useState(true);
    const [blockedDates, setBlockedDates] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get('/users/professionals')
            .then(res => {
                const data = res.data as Professional[];
                setProfessionals(data);
                const uniqueSpecialties = Array.from(new Set(data.map(p => p.specialty))).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
                setSpecialties(uniqueSpecialties);

                // Si venimos de "Editar", pre-seleccionamos
                if (editState?.professionalId) {
                    const prof = data.find(p => p.id === editState.professionalId);
                    if (prof) {
                        setSelectedSpecialty(prof.specialty);
                        setSelectedProf(prof.id);
                    }
                }
            })
            .catch(err => {
                if (err.response?.status !== 401) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Error cargando profesionales. Verifique conexión al servidor API.',
                        icon: 'error',
                        confirmButtonColor: '#10b981'
                    });
                }
            })
            .finally(() => setLoading(false));
    }, [editState]);

    useEffect(() => {
        if (!selectedProf) return;
        
        // Cargar configuración del profesional (Sábados)
        api.get(`/appointments/professional/settings/${selectedProf}`)
            .then(res => setWorksSaturdays(res.data.worksWeekends))
            .catch(err => console.error("Error fetching prof settings:", err));

        // Cargar bloqueos (para identificar días deshabilitados por completo)
        api.get(`/appointments/professional/${selectedProf}`)
            .then(res => {
                const fullDayBlocks = res.data
                    .filter((a: any) => a.status === 'BLOCKED' && a.startTime === '00:00:00' && a.endTime === '23:59:00')
                    .map((a: any) => a.appointmentDate.split('T')[0]);
                setBlockedDates(fullDayBlocks);
            })
            .catch(err => console.error("Error fetching prof blocks:", err));
    }, [selectedProf]);

    useEffect(() => {
        if (selectedProf && selectedDate) {
            setLoading(true);
            api.get(`/appointments/available-slots?profId=${selectedProf}&date=${selectedDate}`)
                .then(res => setAvailableSlots(res.data))
                .catch(err => {
                    console.error("Error fetching slots:", err);
                    Swal.fire({
                        title: 'Error',
                        text: 'Error al cargar horarios disponibles. Intente de nuevo.',
                        icon: 'error',
                        confirmButtonColor: '#10b981'
                    });
                })
                .finally(() => setLoading(false));
        }
    }, [selectedProf, selectedDate]);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const [h, m] = selectedSlot.split(':').map(Number);
            let endH = h;
            let endM = m + 30;
            if (endM >= 60) {
                endH += 1;
                endM -= 60;
            }

            const startTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
            const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;

            await api.post('/appointments', {
                professionalId: selectedProf,
                patientId: localStorage.getItem('profileId') || localStorage.getItem('userId'),
                appointmentDate: selectedDate,
                startTime: startTime,
                endTime: endTime
            });

            // Si es reprogramación, automáticamente cancelar el turno anterior
            if (editState?.appointmentIdToCancel) {
                try {
                    await api.put(`/appointments/${editState.appointmentIdToCancel}/reschedule-mark`);
                } catch (cancelError) {
                    console.error("Error marcando el turno anterior como reprogramado", cancelError);
                }
            }

            setSuccess(true);
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al confirmar el turno.',
                icon: 'error',
                confirmButtonColor: '#10b981'
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-100 rotate-3">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">¡Turno Confirmado!</h2>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 max-w-sm mx-auto">
                    <p className="text-slate-900 font-black text-lg">{professionals.find(p => p.id === selectedProf)?.firstName} {professionals.find(p => p.id === selectedProf)?.lastName}</p>
                    <p className="text-emerald-600 font-black text-xs uppercase tracking-widest mb-3">{selectedSpecialty}</p>
                    <p className="text-slate-500 font-bold text-sm border-t border-slate-200 pt-3">
                        {format(new Date(selectedDate.split('-').map(Number)[0], selectedDate.split('-').map(Number)[1]-1, selectedDate.split('-').map(Number)[2]), "EEEE d 'de' MMMM", { locale: es })}
                        <br/>a las {selectedSlot} hs
                    </p>
                </div>
                <p className="text-slate-400 text-sm font-medium max-w-md mx-auto mb-10">Su cita ha sido registrada exitosamente. Ya puede verla en sus próximos turnos.</p>

                <div className="flex flex-col gap-3 w-full max-w-sm">
                    <Button onClick={() => navigate('/patient/dashboard')} className="rounded-2xl py-6 font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100">
                        Volver al Inicio
                    </Button>
                    <Button onClick={() => { setSuccess(false); setSelectedSpecialty(''); setSelectedProf(''); setSelectedDate(''); setSelectedSlot(''); navigate('/patient/book', { replace: true, state: null }); }} variant="secondary" className="rounded-2xl py-5 font-bold">
                        Reservar otro turno
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-12 space-y-6 sm:space-y-10 overflow-hidden w-full">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
                <div className="w-full">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Volver
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight w-full break-words">
                        {editState ? 'Reprogramar Turno' : 'Solicitar Turno'}
                    </h1>
                    <p className="text-slate-500 font-medium text-base sm:text-lg mt-1 w-full">
                        {editState ? `Nueva fecha para su cita con el profesional.` : 'Completá los pasos para agendar tu cita.'}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Paso 1: Especialidad */}
                <section className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group h-full">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <label className="flex items-center gap-3 text-lg sm:text-xl font-black text-slate-800 tracking-tight mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span>1. Especialidad</span>
                    </label>
                    <select
                        className="w-full p-3 sm:p-4 text-base border-2 border-slate-50 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-50 truncate pr-8 box-border"
                        value={selectedSpecialty}
                        disabled={!!editState}
                        onChange={(e) => {
                            setSelectedSpecialty(e.target.value);
                            setSelectedProf('');
                            setSelectedDate('');
                            setSelectedSlot('');
                        }}
                    >
                        <option value="">Especialidad...</option>
                        {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </section>

                {/* Paso 2: Profesional */}
                <section className={clsx(
                    "bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group h-full transition-all duration-500",
                    (selectedSpecialty || editState) ? "opacity-100 translate-y-0" : "opacity-30 blur-[2px] pointer-events-none"
                )}>
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <label className="flex items-center gap-3 text-lg sm:text-xl font-black text-slate-800 tracking-tight mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-teal-50 text-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span>2. Profesional</span>
                    </label>
                    <select
                        className="w-full p-3 sm:p-4 text-base border-2 border-slate-50 rounded-xl bg-slate-50 focus:bg-white focus:border-teal-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-50 truncate pr-8 box-border"
                        value={selectedProf}
                        disabled={!!editState}
                        onChange={(e) => { setSelectedProf(e.target.value); setSelectedDate(''); setSelectedSlot(''); }}
                    >
                        <option value="">Especialista...</option>
                        {professionals
                            .filter(p => p.specialty === selectedSpecialty)
                            .reduce((acc: Professional[], current) => {
                                const x = acc.find(item => item.firstName === current.firstName && item.lastName === current.lastName);
                                if (!x) return acc.concat([current]);
                                else return acc;
                            }, [])
                            .map(p => (
                                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                            ))
                        }
                    </select>
                </section>

                {/* Paso 3: Fecha */}
                <section className={clsx(
                    "bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group h-full transition-all duration-500 md:col-span-2",
                    selectedProf ? "opacity-100 translate-y-0" : "opacity-30 blur-[2px] pointer-events-none"
                )}>
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <label className="flex items-center gap-3 text-lg sm:text-xl font-black text-slate-800 tracking-tight mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-emerald-100 text-emerald-700 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span>3. {editState ? 'Nueva Fecha' : 'Elija Fecha'}</span>
                    </label>
                    <input
                        type="date"
                        min={format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd')}
                        className="w-full p-3 sm:p-4 text-base border-2 border-slate-50 rounded-xl bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none transition-all font-bold text-slate-700 box-border truncate"
                        value={selectedDate}
                        onChange={(e) => { 
                            const dateStr = e.target.value;
                            if (!dateStr) return;
                            const [year, month, day] = dateStr.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            
                            if (date.getDay() === 0) {
                                Swal.fire({ title: 'Día no disponible', text: 'El centro permanece cerrado los domingos.', icon: 'info', confirmButtonColor: '#10b981' });
                                setSelectedDate('');
                            } else if (date.getDay() === 6 && !worksSaturdays) {
                                Swal.fire({ title: 'Día no disponible', text: 'El profesional no trabaja los sábados.', icon: 'info', confirmButtonColor: '#10b981' });
                                setSelectedDate('');
                            } else if (blockedDates.includes(dateStr)) {
                                Swal.fire({ title: 'Día bloqueado', text: 'Sin disponibilidad para esta fecha.', icon: 'warning', confirmButtonColor: '#10b981' });
                                setSelectedDate('');
                            } else {
                                setSelectedDate(dateStr);
                            }
                            setSelectedSlot(''); 
                        }}
                    />
                </section>
            </div>

                {/* Paso 4: Horarios */}
                {selectedDate && (
                    <section className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-500 mb-24 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <label className="flex items-center gap-3 sm:gap-4 text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-4 sm:mb-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <span>4. Horarios Disponibles</span>
                        </label>

                        {loading ? (
                            <div className="flex flex-col items-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Buscando disponibildiad...</p>
                            </div>
                        ) : availableSlots.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={clsx(
                                            "p-5 rounded-2xl border-2 text-center text-xl font-black transition-all shadow-sm active:scale-95",
                                            selectedSlot === slot
                                                ? "border-emerald-600 bg-emerald-600 text-white shadow-emerald-100 rotate-1"
                                                : "border-slate-50 bg-slate-50 text-slate-500 hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                                        )}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50/50 p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
                                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="font-black text-slate-800 text-xl tracking-tight">No hay horarios para este día</p>
                                <p className="text-slate-500 font-medium">Por favor, seleccioná otra fecha para ver más opciones.</p>
                            </div>
                        )}
                    </section>
                )}


            {selectedSlot && (
                <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[100] animate-in slide-in-from-bottom-full duration-500">
                    <div className="max-w-xl mx-auto flex items-center gap-6">
                        <div className="hidden sm:block">
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Turno seleccionado</p>
                            <p className="text-emerald-700 font-black text-xl">{selectedSlot} hs</p>
                        </div>
                        <Button
                            fullWidth
                            onClick={handleConfirm}
                            disabled={loading}
                            className="py-6 text-xl font-black rounded-2xl shadow-2xl shadow-emerald-200 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading ? 'Confirmando...' : editState ? 'Reprogramar Cita' : 'Confirmar mi Cita'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
