import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppointmentRow {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    professionalName: string;
    patientName: string;
}

export default function AdminAgenda() {
    const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/appointments/all')
            .then(r => setAppointments(r.data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-indigo-600">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Agenda General</h1>
                    <p className="text-slate-500 text-sm font-medium">Cronograma completo de turnos</p>
                </div>
            </div>
            {loading ? <p>Cargando agenda...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <tr><th className="p-2">Fecha</th><th className="p-2">Inicio</th><th className="p-2">Fin</th><th className="p-2">Profesional</th><th className="p-2">Paciente</th><th className="p-2">Estado</th></tr>
                        </thead>
                        <tbody>
                            {appointments.map(app => (
                                <tr key={app.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="p-2">{app.appointmentDate}</td>
                                    <td className="p-2">{app.startTime}</td>
                                    <td className="p-2">{app.endTime}</td>
                                    <td className="p-2">{app.professionalName}</td>
                                    <td className="p-2">{app.patientName}</td>
                                    <td className="p-2">{app.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
