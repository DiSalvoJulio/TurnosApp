import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';

interface ProfessionRow {
    id: string;
    name: string;
    isActive: boolean;
}

export default function AdminProfessions() {
    const [professions, setProfessions] = useState<ProfessionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProfessionName, setNewProfessionName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const loadProfessions = () => {
        setLoading(true);
        api.get('/professions')
            .then((r) => setProfessions(r.data))
            .catch(() => Swal.fire('Error', 'No se pudieron cargar las especialidades', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadProfessions(); }, []);

    const handleCreate = async () => {
        const name = newProfessionName.trim();
        if (!name) return;

        // Front-end check for duplicates
        if (professions.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            return Swal.fire('Atención', 'Esa especialidad ya se encuentra en el listado.', 'warning');
        }

        const confirm = await Swal.fire({
            title: '¿Confirmar nueva especialidad?',
            text: `Se agregará "${name}" al sistema.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, agregar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        try {
            await api.post('/professions', { name });
            setNewProfessionName('');
            Swal.fire({
                title: '¡Listo!',
                text: 'Especialidad creada con éxito.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            loadProfessions();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data || 'No se pudo crear la especialidad.', 'error');
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/professions/${id}/toggle`);
            Swal.fire({
                title: currentStatus ? 'Desactivada' : 'Activada',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            loadProfessions();
        } catch {
            Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
        }
    };

    const startEdit = (prof: ProfessionRow) => {
        setEditingId(prof.id);
        setEditName(prof.name);
    };

    const handleSaveEdit = async (id: string, active: boolean) => {
        const name = editName.trim();
        if (!name) return;

        // Duplication check (exclude current id)
        if (professions.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) {
            return Swal.fire('Atención', 'Ya existe otra especialidad con ese nombre.', 'warning');
        }

        try {
            await api.put(`/professions/${id}`, { name, isActive: active });
            setEditingId(null);
            Swal.fire('Actualizado', 'La especialidad se actualizó correctamente.', 'success');
            loadProfessions();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data || 'Error al actualizar.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará la especialidad de forma permanente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/professions/${id}`);
                Swal.fire('Eliminado', 'La especialidad ha sido borrada.', 'success');
                loadProfessions();
            } catch {
                Swal.fire('Error', 'No se pudo eliminar la especialidad.', 'error');
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-indigo-600">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Gestión de Especialidades</h1>
                    <p className="text-slate-500 text-sm font-medium">Configure las ramas médicas del centro</p>
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newProfessionName}
                    onChange={(e) => setNewProfessionName(e.target.value)}
                    placeholder="Nueva especialidad (ej. Odontología)"
                    className="flex-1 border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                    onClick={handleCreate}
                    className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                    Agregar Especialidad
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Cargando...</div>
            ) : (
                <div className="bg-slate-50 rounded-2xl p-4 overflow-hidden shadow-inner">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 uppercase text-xs">
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3 w-48">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {professions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-500">No hay especialidades registradas.</td>
                                </tr>
                            ) : (
                                professions.map((p) => (
                                    <tr key={p.id} className="border-t border-slate-200 hover:bg-white/50 transition-colors">
                                        <td className="p-3 font-medium">
                                            {editingId === p.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className={!p.isActive ? 'text-slate-400 italic' : 'text-slate-700'}>{p.name}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {p.isActive ? 'ACTIVA' : 'INACTIVA'}
                                            </span>
                                        </td>
                                        <td className="p-3 flex gap-2">
                                            {editingId === p.id ? (
                                                <>
                                                    <button onClick={() => handleSaveEdit(p.id, p.isActive)} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition shadow-sm">Guardar</button>
                                                    <button onClick={() => setEditingId(null)} className="bg-slate-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-500 transition shadow-sm">Cancelar</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(p)} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 transition shadow-sm">Editar</button>
                                                    <button onClick={() => handleToggle(p.id, p.isActive)} className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-sm ${p.isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}>
                                                        {p.isActive ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600 transition shadow-sm">Borrar</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
