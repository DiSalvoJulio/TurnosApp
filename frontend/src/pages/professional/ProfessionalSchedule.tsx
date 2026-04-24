import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, Calendar, AlertCircle, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import Swal from 'sweetalert2';
import clsx from 'clsx';

interface BlockSlot {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
}

interface WorkingHour {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

const DAYS_OF_WEEK = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' }
];

export default function ProfessionalSchedule() {
    const [blocks, setBlocks] = useState<BlockSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBlockForm, setShowBlockForm] = useState(false);

    // Config states
    const [worksWeekends, setWorksWeekends] = useState(true);
    const [appointmentDuration, setAppointmentDuration] = useState(30);
    const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);

    // Form State for blocks
    const [blockDate, setBlockDate] = useState('');
    const [blockStart, setBlockStart] = useState('');
    const [blockEnd, setBlockEnd] = useState('');

    const profId = localStorage.getItem('profileId');

    useEffect(() => {
        if (profId) {
            fetchBlocks();
            fetchSettings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profId]);

    const fetchBlocks = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/appointments/professional/${profId}`);
            const filteredBlocks = data
                .filter((app: { status: string; appointmentDate: string }) => app.status === 'BLOCKED')
                .sort((a: { appointmentDate: string }, b: { appointmentDate: string }) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
            setBlocks(filteredBlocks);
        } catch {
            // Silently handle error
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await api.get(`/appointments/professional/settings/${profId}`);
            setWorksWeekends(data.worksWeekends);
            setAppointmentDuration(data.appointmentDuration);
            setWorkingHours(data.workingHours || []);
        } catch {
            // Silently handle error
        }
    };

    const handleSaveSchedule = async () => {
        // Validación de superposición o errores en horarios
        for (const day of [1, 2, 3, 4, 5, 6]) {
            const dayHours = workingHours.filter((wh: { dayOfWeek: number }) => wh.dayOfWeek === day);
            for (let i = 0; i < dayHours.length; i++) {
                const current = dayHours[i];
                if (current.startTime >= current.endTime) {
                    Swal.fire({
                        title: 'Horario Inválido',
                        text: `En el día ${DAYS_OF_WEEK.find(d => d.id === day)?.name}, la hora de inicio debe ser anterior a la hora de fin.`,
                        icon: 'warning',
                        confirmButtonColor: '#6366f1'
                    });
                    return;
                }
                for (let j = i + 1; j < dayHours.length; j++) {
                    const next = dayHours[j];
                    if (current.startTime >= next.startTime) {
                        Swal.fire({
                            title: 'Horarios Desordenados',
                            text: `En el día ${DAYS_OF_WEEK.find(d => d.id === day)?.name}, coloca las franjas horarias en orden cronológico (las más tempranas arriba).`,
                            icon: 'warning',
                            confirmButtonColor: '#6366f1'
                        });
                        return;
                    }
                    if (current.startTime < next.endTime && current.endTime > next.startTime) {
                        Swal.fire({
                            title: 'Horarios Superpuestos',
                            text: `En el día ${DAYS_OF_WEEK.find(d => d.id === day)?.name}, tienes franjas que se están cruzando o pisando entre sí. Corrígelas.`,
                            icon: 'warning',
                            confirmButtonColor: '#6366f1'
                        });
                        return;
                    }
                }
            }
        }

        try {
            await api.patch(`/appointments/professional/settings/${profId}`, {
                worksWeekends,
                appointmentDuration,
                workingHours
            });

            Swal.fire({
                title: 'Ajuste Actualizado',
                text: 'La configuración de su agenda ha sido guardada.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        } catch {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo actualizar la configuración.',
                icon: 'error',
                confirmButtonColor: '#6366f1'
            });
        }
    };

    const updateWorkingHour = (day: number, start: string, end: string, action: 'add' | 'update' | 'remove', index?: number) => {
        const newWh = [...workingHours];
        if (action === 'add') {
            newWh.push({ dayOfWeek: day, startTime: start, endTime: end });
        } else if (action === 'remove' && index !== undefined) {
            newWh.splice(index, 1);
        } else if (action === 'update' && index !== undefined) {
            newWh[index] = { dayOfWeek: day, startTime: start, endTime: end };
        }

        setWorkingHours(newWh);
    };

    const applyTemplate = (day: number, template: string) => {
        const wh = workingHours.filter(w => w.dayOfWeek !== day);
        if (template === 'morning') {
            wh.push({ dayOfWeek: day, startTime: '08:00:00', endTime: '12:00:00' });
        } else if (template === 'afternoon') {
            wh.push({ dayOfWeek: day, startTime: '16:00:00', endTime: '20:00:00' });
        } else if (template === 'full') {
            wh.push({ dayOfWeek: day, startTime: '08:00:00', endTime: '20:00:00' });
        } else if (template === 'split') {
            wh.push({ dayOfWeek: day, startTime: '08:00:00', endTime: '12:00:00' });
            wh.push({ dayOfWeek: day, startTime: '16:00:00', endTime: '20:00:00' });
        }

        setWorkingHours(wh);
    };

    const handleBlockTime = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blockDate || !blockStart || !blockEnd) return;

        setLoading(true);
        try {
            await api.post('/appointments/block', {
                professionalId: profId,
                date: blockDate,
                startTime: blockStart + ':00',
                endTime: blockEnd + ':00'
            });
            setShowBlockForm(false);
            setBlockDate(''); setBlockStart(''); setBlockEnd('');
            fetchBlocks();
            Swal.fire({
                title: '¡Bloqueado!',
                text: 'El horario ha sido bloqueado correctamente.',
                icon: 'success',
                confirmButtonColor: '#6366f1'
            });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const errorMsg = err.response?.data?.message || 'Error al bloquear el horario.';
            Swal.fire({ title: 'Error', text: errorMsg, icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBlock = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Eliminar bloqueo?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/appointments/${id}/cancel`);
            fetchBlocks();
            Swal.fire({ title: 'Eliminado', icon: 'success' });
        } catch {
            Swal.fire({ title: 'Error', icon: 'error' });
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Horarios</h1>
                    <p className="text-slate-500 font-medium">Configure sus horarios semanales de atención y franjas bloqueadas.</p>
                </div>
                <Button onClick={handleSaveSchedule} className="rounded-xl px-8 h-12 shadow-lg shadow-indigo-100 flex items-center gap-2">
                    <Save className="w-5 h-5" /> Guardar Cambios
                </Button>
            </header>

            {/* Configuración General y Semanal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Configuraciones generales */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm border-t-4 border-t-indigo-500">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6">Configuración General</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Duración de cada turno</label>
                                <select
                                    value={appointmentDuration}
                                    onChange={(e) => setAppointmentDuration(parseInt(e.target.value))}
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                >
                                    <option value={30}>30 Minutos</option>
                                    <option value={60}>60 Minutos</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Atención Fines de Semana</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <span className="text-sm font-medium text-slate-600 flex-1">Trabajar Sábados</span>
                                    <button
                                        onClick={() => setWorksWeekends(!worksWeekends)}
                                        className={clsx(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                            worksWeekends ? "bg-indigo-600" : "bg-slate-300"
                                        )}
                                    >
                                        <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", worksWeekends ? "translate-x-6" : "translate-x-1")} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">Nota: Los domingos están bloqueados por defecto en el sistema.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Horarios por Día */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Horarios Semanales</h2>
                        <p className="text-slate-500 text-sm mb-6">Defina sus franjas horarias de atención (entre 08:00 y 20:00).</p>

                        <div className="space-y-4">
                            {DAYS_OF_WEEK.map(day => {
                                if (day.id === 0) return null; // Saltar domingo visualmente si no es configurable, o mostrarlo deshabilitado
                                if (day.id === 6 && !worksWeekends) return null; // Ocultar sábado si no trabaja

                                const dayHours = workingHours.filter(wh => wh.dayOfWeek === day.id);

                                return (
                                    <div key={day.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <h3 className="font-black text-slate-800 w-24">{day.name}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => applyTemplate(day.id, 'morning')} className="px-3 py-1 text-xs font-bold rounded-lg bg-white border shadow-sm hover:bg-emerald-50 text-emerald-700">Mañana</button>
                                                <button onClick={() => applyTemplate(day.id, 'afternoon')} className="px-3 py-1 text-xs font-bold rounded-lg bg-white border shadow-sm hover:bg-emerald-50 text-emerald-700">Tarde</button>
                                                <button onClick={() => applyTemplate(day.id, 'full')} className="px-3 py-1 text-xs font-bold rounded-lg bg-white border shadow-sm hover:bg-emerald-50 text-emerald-700">Complet.</button>
                                                <button onClick={() => applyTemplate(day.id, 'split')} className="px-3 py-1 text-xs font-bold rounded-lg bg-white border shadow-sm hover:bg-emerald-50 text-emerald-700">Cortado</button>
                                                <button onClick={() => applyTemplate(day.id, 'none')} className={clsx("px-3 py-1 text-xs font-bold rounded-lg border shadow-sm transition-colors", dayHours.length === 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-white hover:bg-red-50 text-red-600")}>No trabaja</button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {dayHours.length === 0 ? (
                                                <p className="text-sm text-red-500 font-bold italic flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4" /> Sin horarios asignados (No atiende)
                                                </p>
                                            ) : (
                                                dayHours.map((wh, idx) => {
                                                    const globalIdx = workingHours.indexOf(wh);
                                                    return (
                                                        <div key={idx} className="flex items-center gap-3 bg-white p-2 px-3 rounded-xl border border-slate-100 shadow-sm w-fit">
                                                            <input
                                                                type="time"
                                                                value={wh.startTime.substring(0, 5)}
                                                                onChange={(e) => updateWorkingHour(day.id, e.target.value + ':00', wh.endTime, 'update', globalIdx)}
                                                                className="outline-none font-bold text-slate-700 bg-transparent"
                                                            />
                                                            <span className="text-slate-300">-</span>
                                                            <input
                                                                type="time"
                                                                value={wh.endTime.substring(0, 5)}
                                                                onChange={(e) => updateWorkingHour(day.id, wh.startTime, e.target.value + ':00', 'update', globalIdx)}
                                                                className="outline-none font-bold text-slate-700 bg-transparent"
                                                            />
                                                            <button onClick={() => updateWorkingHour(day.id, '', '', 'remove', globalIdx)} className="ml-2 text-rose-400 hover:text-rose-600">
                                                                <XCircleIcon />
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                        <button
                                            onClick={() => updateWorkingHour(day.id, '08:00:00', '12:00:00', 'add')}
                                            className="mt-3 text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
                                        >
                                            <Plus className="w-3 h-3" /> Añadir franja
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Franjas de Bloqueo Específicas */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                {/* Lo mantenemos idéntico a la versión anterior */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Días u Horarios Bloqueados</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Excepciones y Vacaciones</p>
                        </div>
                    </div>
                    {!showBlockForm && (
                        <Button onClick={() => setShowBlockForm(true)} className="rounded-2xl px-10 h-14 bg-blue-600 flex items-center gap-3">
                            <Plus className="w-5 h-5" /> Nuevo Bloqueo Particular
                        </Button>
                    )}
                </div>

                {showBlockForm && (
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleBlockTime} className="bg-slate-50 p-8 rounded-[2rem] border-2 border-indigo-100">
                            {/* Inputs de bloqueo (igual que antes) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">Fecha</label>
                                    <input type="date" required min={format(new Date(), 'yyyy-MM-dd')} className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none" value={blockDate} onChange={e => setBlockDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">Desde (HH:mm)</label>
                                    <input type="time" required className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none" value={blockStart} onChange={e => setBlockStart(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">Hasta (HH:mm)</label>
                                    <input type="time" required className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setShowBlockForm(false)} className="rounded-xl px-6">Cancelar</Button>
                                <Button type="submit" disabled={loading} className="rounded-xl px-8 shadow-lg shadow-indigo-100">Confirmar Bloqueo</Button>
                            </div>
                        </form>
                    </div>
                )}

                {loading && blocks.length === 0 ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
                    </div>
                ) : blocks.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-400 font-medium">No tienes bloqueos particulares activos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {blocks.map(block => {
                            const d = new Date(block.appointmentDate);
                            const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
                            return (
                                <div key={block.id} className="group bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-slate-400 shadow-sm">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 capitalize">{format(localDate, "EEEE d 'de' MMMM", { locale: es })}</p>
                                            <p className="text-slate-500 font-bold text-sm">{block.startTime.substring(0, 5)} - {block.endTime.substring(0, 5)} hs</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteBlock(block.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function XCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
    )
}
