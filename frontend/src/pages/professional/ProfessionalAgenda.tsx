import { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Clock, User, Trash2, ChevronLeft, ChevronRight, AlertCircle, ClipboardList, Calendar, Bell } from 'lucide-react';
import clsx from 'clsx';
import Swal from 'sweetalert2';

interface Appointment {
    id: string;
    patientId?: string;
    patientName: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
}

export default function ProfessionalAgenda() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const profId = localStorage.getItem('profileId');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        // Auto-scroll the days container so the active day is centered
        if (scrollContainerRef.current) {
            const selectedBtn = scrollContainerRef.current.querySelector('button[aria-selected="true"]');
            if (selectedBtn) {
                selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedDate, currentWeekStart]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/appointments/professional/${profId}`);
            setAppointments(data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate past pending appointments
    const pastPendingCount = useMemo(() => {
        const today = startOfDay(new Date());
        return appointments.filter(app => {
            if (app.status === 'COMPLETED' || app.status === 'CANCELLED' || app.status === 'BLOCKED') return false;
            const appDate = parseISO(app.appointmentDate);
            return isBefore(appDate, today);
        }).length;
    }, [appointments]);

    const handleCancel = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: 'Desea cancelar este turno reservado por el paciente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, cancelar turno',
            cancelButtonText: 'No'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/appointments/${id}/cancel`);
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 'CANCELLED' } : app));
            Swal.fire({
                title: 'Cancelado',
                text: 'El turno ha sido cancelado.',
                icon: 'success',
                confirmButtonColor: '#2563eb'
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Error al cancelar el turno',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const handleAttend = async (app: Appointment) => {
        const { value: note } = await Swal.fire({
            title: `Evolución: ${app.patientName}`,
            input: 'textarea',
            inputPlaceholder: 'Escriba las notas de la consulta aquí...',
            inputAttributes: {
                'aria-label': 'Notas de la consulta'
            },
            showCancelButton: true,
            confirmButtonText: 'Guardar y Finalizar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3b82f6',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes escribir al menos una nota o evolución.';
                }
            }
        });

        if (note) {
            if (!profId) {
                Swal.fire('Error', 'No se detectó su sesión de profesional. Vuelva a iniciar sesión.', 'error');
                return;
            }
            if (!app.patientId) {
                Swal.fire('Error', 'No se encontró el paciente asociado al turno. Actualice la agenda o contacte soporte.', 'error');
                return;
            }

            try {
                await api.post('/history/evolution', {
                    patientId: app.patientId,
                    professionalId: profId,
                    appointmentId: app.id,
                    note: note
                });

                setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, status: 'COMPLETED' } : a));

                await Swal.fire({
                    title: '¡Finalizado!',
                    text: 'Se ha registrado la evolución y el turno se marcó como completado.',
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
            } catch (error) {
                Swal.fire('Error', 'No se pudo guardar la evolución.', 'error');
            }
        }
    };

    // Generar los días de la semana actual
    const weekDays = useMemo(() => {
        return Array.from({ length: 6 }).map((_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    // Filtrar turnos para el día seleccionado
    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(app => {
                if (app.status === 'BLOCKED') return false;
                try {
                    const appDate = parseISO(app.appointmentDate);
                    return isSameDay(appDate, selectedDate);
                } catch {
                    return false;
                }
            })
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }, [appointments, selectedDate]);

    const changeWeek = (direction: number) => {
        setCurrentWeekStart(prev => addDays(prev, direction * 7));
    };

    const handleNewAppointment = async () => {
        const { value: dni } = await Swal.fire({
            title: 'Reservar Nuevo Turno',
            text: 'Ingrese el DNI del paciente para comenzar:',
            input: 'text',
            inputPlaceholder: 'DNI sin puntos ni espacios',
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#3b82f6',
            cancelButtonText: 'Cancelar',
        });

        if (!dni) return;

        try {
            // 1. Buscar paciente
            const { data: searchResults } = await api.get(`/history/search?query=${dni}`);
            let patientId = '';
            let patientName = '';

            const exactMatch = searchResults.find((p: any) => p.dni === dni);

            if (exactMatch) {
                patientId = exactMatch.id;
                patientName = `${exactMatch.firstName} ${exactMatch.lastName}`;

                const confirmPat = await Swal.fire({
                    title: 'Paciente encontrado',
                    text: `¿Desea agendar el turno para ${patientName}? (DNI: ${dni})`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#3b82f6',
                    confirmButtonText: 'Sí, continuar',
                    cancelButtonText: 'Cancelar'
                });
                
                if (!confirmPat.isConfirmed) return;
            } else {
                // 2. Registrar paciente nuevo
                const confirmRes = await Swal.fire({
                    title: 'Paciente no encontrado',
                    text: `¿Desea registrar un nuevo paciente con DNI ${dni}?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, registrar',
                    cancelButtonText: 'No'
                });

                if (!confirmRes.isConfirmed) return;

                const { value: formValues } = await Swal.fire({
                    title: 'Datos del Nuevo Paciente',
                    html:
                        '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
                        '<input id="swal-input2" class="swal2-input" placeholder="Apellido">' +
                        '<input id="swal-input3" class="swal2-input" placeholder="Email">' +
                        '<input id="swal-input4" class="swal2-input" placeholder="Teléfono">',
                    focusConfirm: false,
                    showCancelButton: true,
                    preConfirm: () => {
                        const firstName = (document.getElementById('swal-input1') as HTMLInputElement).value;
                        const lastName = (document.getElementById('swal-input2') as HTMLInputElement).value;
                        const email = (document.getElementById('swal-input3') as HTMLInputElement).value;
                        const phone = (document.getElementById('swal-input4') as HTMLInputElement).value;
                        if (!firstName || !lastName || !email) {
                            Swal.showValidationMessage('Nombre, Apellido y Email son obligatorios');
                            return false;
                        }
                        return { firstName, lastName, email, phone };
                    }
                });

                if (formValues) {
                    await api.post('/auth/register/patient', {
                        ...formValues,
                        dni,
                        address: 'Registrado por profesional',
                        password: '123'
                    });
                    
                    // Ya registrado, lo buscamos de nuevo para obtener el ID
                    const { data: newSearch } = await api.get(`/history/search?query=${dni}`);
                    const newPat = newSearch.find((p: any) => p.dni === dni);
                    patientId = newPat.id;
                    patientName = `${newPat.firstName} ${newPat.lastName}`;
                } else return;
            }

            // 3. Seleccionar Fecha y Hora
            const { value: dateStr } = await Swal.fire({
                title: 'Seleccionar Fecha',
                html: `<input type="date" id="swal-date" class="swal2-input" min="${format(addDays(new Date(), 1), 'yyyy-MM-dd')}">`,
                preConfirm: () => (document.getElementById('swal-date') as HTMLInputElement).value,
                showCancelButton: true
            });

            if (!dateStr) return;

            const { data: slots } = await api.get(`/appointments/available-slots?profId=${profId}&date=${dateStr}`);
            
            if (!slots || slots.length === 0) {
                Swal.fire('No hay horarios', 'No hay horarios disponibles para la fecha seleccionada.', 'info');
                return;
            }

            const { value: slotIndex } = await Swal.fire({
                title: 'Seleccionar Horario',
                input: 'select',
                inputOptions: slots.reduce((acc: any, s: string, i: number) => {
                    acc[i] = s + " hs";
                    return acc;
                }, {}),
                inputPlaceholder: 'Seleccione un horario...',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) {
                        return 'Debes seleccionar un horario';
                    }
                }
            });

            if (slotIndex !== undefined && slotIndex !== null && slotIndex !== "") {
                const selectedSlot = slots[parseInt(slotIndex)];
                
                // Calcular EndTime (start + 30min)
                const [h, m] = selectedSlot.split(':').map(Number);
                const endM = m + 30;
                const finalH = h + Math.floor(endM / 60);
                const finalM = endM % 60;
                const endTime = `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;

                await api.post('/appointments', {
                    professionalId: profId,
                    patientId: patientId,
                    appointmentDate: dateStr,
                    startTime: selectedSlot + ":00",
                    endTime: endTime + ":00"
                });

                await Swal.fire({
                    title: '¡Éxito!',
                    text: `Turno reservado para ${patientName} a las ${selectedSlot} hs`,
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
                fetchAppointments(); // Recargar agenda
            }

        } catch (error: any) {
            Swal.fire('Error', error.response?.data || 'Ocurrió un error inesperado.', 'error');
        }
    };

    const handleGoToPastPending = () => {
        // Encontrar el primer turno pendiente pasado
        const today = startOfDay(new Date());
        const firstPastPending = appointments.find(app => {
            if (app.status === 'COMPLETED' || app.status === 'CANCELLED' || app.status === 'BLOCKED') return false;
            const appDate = parseISO(app.appointmentDate);
            return isBefore(appDate, today);
        });

        if (firstPastPending) {
            const date = parseISO(firstPastPending.appointmentDate);
            setSelectedDate(date);
            setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
            Swal.fire({
                title: 'Turnos Pendientes',
                text: `Te hemos llevado al ${format(date, "d 'de' MMMM", { locale: es })} para que puedas revisar el turno pendiente de ${firstPastPending.patientName}.`,
                icon: 'info',
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20">
            {/* Banner de Notificación */}
            {pastPendingCount > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-[1.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
                            <Bell className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-amber-900 leading-tight">Tienes {pastPendingCount} {pastPendingCount === 1 ? 'turno pendiente' : 'turnos pendientes'}</h2>
                            <p className="text-amber-700 font-medium text-sm">Hay citas pasadas esperando ser finalizadas.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleGoToPastPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-black px-5 h-10 rounded-xl shadow-md shadow-amber-100 transition-all active:scale-95 whitespace-nowrap text-sm"
                    >
                        Revisar ahora
                    </Button>
                </div>
            )}

            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-black uppercase tracking-widest">Profesional</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agenda Médica</h1>
                        <p className="text-slate-500 font-medium text-sm">Gestión organizada de sus citas y pacientes.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                            onClick={handleNewAppointment}
                            className="w-full sm:w-auto rounded-xl px-6 h-10 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95 text-sm"
                        >
                            <Calendar className="w-4 h-4" />
                            Nuevo Turno
                        </Button>
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                            <button
                                onClick={() => changeWeek(-1)}
                                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-3 py-1 font-black text-slate-700 uppercase tracking-tight text-xs min-w-[100px] text-center">
                                {format(currentWeekStart, 'MMMM yyyy', { locale: es })}
                            </div>
                            <button
                                onClick={() => changeWeek(1)}
                                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Selector de Días */}
            <div ref={scrollContainerRef} className="flex overflow-x-auto pb-3 gap-2 no-scrollbar mb-6 snap-x snap-mandatory">
                {weekDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            aria-selected={isSelected}
                            className={clsx(
                                "flex-shrink-0 min-w-[85px] p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-0.5 snap-center",
                                isSelected
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 -translate-y-0.5"
                                    : "bg-white border-slate-50 text-slate-500 hover:border-blue-200 hover:bg-blue-50/20"
                            )}
                        >
                            <span className={clsx("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-blue-100" : "text-slate-400")}>
                                {format(day, 'EEE', { locale: es })}
                            </span>
                            <span className="text-xl font-black tabular-nums leading-tight">{format(day, 'd')}</span>
                            {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-blue-500 mt-1"></div>}
                        </button>
                    );
                })}
            </div>

            {/* Lista de Turnos */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando agenda...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="bg-white p-16 rounded-[2rem] border border-slate-100 text-center shadow-sm">
                        <Clock className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Día libre</h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">No hay turnos registrados para hoy.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredAppointments.map(app => {
                                                            const isCancelled = app.status === 'CANCELLED' || app.status === 'RESCHEDULED';
                                                            const isRescheduled = app.status === 'RESCHEDULED';
                                                            const isCompleted = app.status === 'COMPLETED';
                                                            const appDate = parseISO(app.appointmentDate);
                                                            const isPast = isBefore(appDate, startOfDay(new Date()));
                                                            const isPastPending = isPast && !isCancelled && !isCompleted;
                                                            const timeStr = app.startTime ? app.startTime.substring(0, 5) : '--:--';

                                                            return (
                                                                <div
                                                                    key={app.id}
                                                                    className={clsx(
                                                                        "group p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden",
                                                                        isCancelled
                                                                            ? "bg-slate-50/50 border-slate-100 opacity-60 grayscale-[0.5]"
                                                                            : isPastPending
                                                                                ? "bg-amber-50/50 border-amber-100 shadow-sm"
                                                                                : "bg-white border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100 hover:border-blue-100"
                                                                    )}
                                                                >
                                                                    {(isPastPending || isRescheduled) && <div className={clsx("absolute top-0 left-0 w-1.5 h-full", isRescheduled ? "bg-amber-400" : "bg-amber-500")}></div>}

                                                                    <div className="flex items-center gap-4">
                                                                        <div className={clsx(
                                                                            "w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-colors shadow-sm shrink-0",
                                                                            isCancelled && !isRescheduled ? "bg-slate-200 text-slate-500" : 
                                                                            isRescheduled ? "bg-amber-50 text-amber-600" :
                                                                            isPastPending ? "bg-amber-100 text-amber-700 font-black" :
                                                                            "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                                                                        )}>
                                                                            <span className="text-[10px] font-black leading-none mb-0.5">HS</span>
                                                                            <span className="text-lg font-black tabular-nums tracking-tight">{timeStr}</span>
                                                                        </div>

                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                                <h3 className={clsx(
                                                                                    "text-lg font-black tracking-tight leading-none transition-colors",
                                                                                    isCancelled && !isRescheduled ? "text-slate-400" : "text-slate-900 group-hover:text-blue-700"
                                                                                )}>
                                                                                    {app.patientName}
                                                                                </h3>
                                                                                <div className="flex gap-1.5">
                                                                                    <span className={clsx(
                                                                                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                                                                                        isRescheduled ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                                        isCancelled ? "bg-red-50 text-red-600 border-red-100" :
                                                                                        isCompleted ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                                        isPastPending ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                                                                    )}>
                                                                                        {isRescheduled ? 'Reprogramado' : isCancelled ? 'Cancelado' : isCompleted ? 'Finalizado' : isPastPending ? 'Pte. Pasado' : 'Confirmado'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                                                                <User className="w-3 h-3" /> Paciente #{app.patientId?.substring(0, 8)}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                                        {!isCancelled && !isCompleted && !isRescheduled && (
                                                                            <>
                                                                                <Button
                                                                                    onClick={() => handleAttend(app)}
                                                                                    className={clsx(
                                                                                        "w-full sm:w-auto rounded-xl px-4 h-10 font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 text-xs",
                                                                                        isPastPending ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                                                                                    )}
                                                                                >
                                                                                    <ClipboardList className="w-4 h-4 flex-shrink-0" />
                                                                                    <span>{isPastPending ? 'Finalizar' : 'Atender'}</span>
                                                                                </Button>
                                                                                <Button
                                                                                    variant="danger"
                                                                                    onClick={() => handleCancel(app.id)}
                                                                                    className="w-full sm:w-auto rounded-xl px-4 h-10 font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 text-xs"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                                                                                    <span>Cancelar</span>
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                        {isCompleted && (
                                                                             <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 w-full sm:w-auto">
                                                                                 <ClipboardList className="w-4 h-4 flex-shrink-0" />
                                                                                 Finalizado
                                                                             </div>
                                                                        )}
                                                                        {isRescheduled && (
                                                                             <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-amber-100 w-full sm:w-auto">
                                                                                 <Calendar className="w-4 h-4 flex-shrink-0" />
                                                                                 Reprogramado
                                                                             </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                        })}
                    </div>
                )}
            </div>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 shadow-2xl z-40 hidden md:flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-white font-bold text-[10px] uppercase tracking-widest">
                    {filteredAppointments.length} turnos • {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </p>
            </div>
        </div>
    );
}
