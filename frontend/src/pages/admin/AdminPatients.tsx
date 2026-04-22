import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Eye, EyeOff, ArrowLeft, Mail, User, Phone, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PatientRow {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    address: string;
    phone: string;
    dateOfBirth: string;
    email: string;
    isActive: boolean;
}

const emptyForm = {
    firstName: '',
    lastName: '',
    dni: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    email: '',
    password: '',
};

export default function AdminPatients() {
    const [patients, setPatients] = useState<PatientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<'name' | 'dni' | 'email'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showPassword, setShowPassword] = useState(false);

    const loadPatients = () => {
        setLoading(true);
        api.get('/users/admin/patients')
            .then((r) => setPatients(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPatients(); }, []);

    const updateForm = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const createPatient = async () => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.dni.trim() || !form.email.trim() || !form.password.trim() || !form.dateOfBirth) {
            return Swal.fire('Error', 'Nombre, Apellido, DNI, Fecha Nac., Email y Contraseña son obligatorios.', 'error');
        }

        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!nameRegex.test(form.firstName)) return Swal.fire('Error', 'El nombre solo debe contener letras.', 'error');
        if (!nameRegex.test(form.lastName)) return Swal.fire('Error', 'El apellido solo debe contener letras.', 'error');

        const dniRegex = /^[0-9]{7,8}$/;
        if (!dniRegex.test(form.dni)) return Swal.fire('Error', 'El DNI debe tener entre 7 y 8 números.', 'error');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) return Swal.fire('Error', 'El email no tiene un formato válido.', 'error');

        try {
            await api.post('/auth/register/patient', {
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                dni: form.dni,
                dateOfBirth: form.dateOfBirth,
                address: form.address,
                phone: form.phone,
            });
            Swal.fire('¡Éxito!', 'Paciente creado correctamente.', 'success');
            setForm(emptyForm);
            setIsCreateOpen(false);
            loadPatients();
        } catch (e: any) {
            Swal.fire('Error', e.response?.data || 'Error al crear paciente.', 'error');
        }
    };

    const cancelAction = () => {
        setIsCreateOpen(false);
        setSelectedId(null);
        setForm(emptyForm);
        setMessage('');
    };

    const startEdit = (p: PatientRow) => {
        setIsCreateOpen(false);
        setSelectedId(p.id);
        setForm({
            firstName: p.firstName,
            lastName: p.lastName,
            dni: p.dni,
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : '',
            address: p.address,
            phone: p.phone,
            email: p.email,
            password: '1234',
        });
        setMessage('');
    };

    const saveChanges = async () => {
        if (!selectedId) return;

        if (!form.firstName.trim() || !form.lastName.trim() || !form.dni.trim() || !form.email.trim() || !form.dateOfBirth) {
            return Swal.fire('Error', 'Nombre, Apellido, DNI, Fecha Nac. y Email son obligatorios.', 'error');
        }

        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!nameRegex.test(form.firstName)) return Swal.fire('Error', 'El nombre solo debe contener letras.', 'error');
        if (!nameRegex.test(form.lastName)) return Swal.fire('Error', 'El apellido solo debe contener letras.', 'error');

        const dniRegex = /^[0-9]{7,8}$/;
        if (!dniRegex.test(form.dni)) return Swal.fire('Error', 'El DNI debe tener entre 7 y 8 números.', 'error');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) return Swal.fire('Error', 'El email no tiene un formato válido.', 'error');

        try {
            await api.put(`/users/patient/${selectedId}/profile`, {
                firstName: form.firstName,
                lastName: form.lastName,
                dni: form.dni,
                dateOfBirth: form.dateOfBirth,
                address: form.address,
                phone: form.phone,
                email: form.email,
            });
            Swal.fire('¡Éxito!', 'Paciente actualizado correctamente.', 'success');
            setSelectedId(null);
            setForm(emptyForm);
            loadPatients();
        } catch {
            Swal.fire('Error', 'No se pudo actualizar el paciente.', 'error');
        }
    };

    const toggleActive = async (p: PatientRow) => {
        try {
            await api.patch(`/users/patient/${p.id}/status`, { isActive: !p.isActive });
            Swal.fire({
                title: p.isActive ? 'Desactivado' : 'Activado',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            loadPatients();
        } catch {
            Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
        }
    };

    const handleDelete = async (p: PatientRow) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Se eliminará permanentemente al paciente "${p.firstName} ${p.lastName}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/users/${p.id}`);
                Swal.fire('¡Eliminado!', 'El paciente ha sido borrado.', 'success');
                loadPatients();
            } catch {
                Swal.fire('Error', 'No se pudo eliminar al paciente.', 'error');
            }
        }
    };

    const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

    const sortedFiltered = useMemo(() => {
        const q = normalize(search);
        const filtered = patients.filter((p) => {
            const fullName = normalize(`${p.firstName} ${p.lastName}`);
            return fullName.includes(q)
                || normalize(p.firstName).includes(q)
                || normalize(p.lastName).includes(q)
                || normalize(p.dni).includes(q)
                || normalize(p.email).includes(q);
        });
        return filtered.sort((a, b) => {
            let av = '';
            let bv = '';
            if (sortKey === 'name') {
                av = `${a.firstName} ${a.lastName}`;
                bv = `${b.firstName} ${b.lastName}`;
            } else if (sortKey === 'dni') {
                av = a.dni;
                bv = b.dni;
            } else {
                av = a.email;
                bv = b.email;
            }
            const cmp = av.localeCompare(bv, 'es', { sensitivity: 'base' });
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }, [patients, search, sortKey, sortOrder]);

    const exportCsv = () => {
        const rows = ['Nombre,DNI,Teléfono,Email,Estado'];
        sortedFiltered.forEach((p) => {
            rows.push(`"${p.firstName} ${p.lastName}","${p.dni}","${p.phone}","${p.email}","${p.isActive ? 'Activo' : 'Inactivo'}"`);
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pacientes.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-indigo-600">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Gestión de Pacientes</h1>
                        <p className="text-slate-500 text-sm font-medium">Administre la base de datos de pacientes</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        if (isCreateOpen) {
                            cancelAction();
                        } else {
                            setSelectedId(null);
                            setForm(emptyForm);
                            setIsCreateOpen(true);
                        }
                    }} 
                    className={`${isCreateOpen ? 'bg-slate-500' : 'bg-indigo-600'} text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95`}
                >
                    {isCreateOpen ? 'Cerrar' : 'Crear paciente'}
                </button>
            </div>

            {message && <div className="mb-3 p-2 bg-green-100 text-green-700 rounded-xl">{message}</div>}

            {isCreateOpen && (
                <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50 mb-6 shadow-inner animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold mb-4 text-emerald-900">Crear nuevo paciente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">Nombre</label>
                            <input name="firstName" value={form.firstName} onChange={updateForm} placeholder="Nombre" className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">Apellido</label>
                            <input name="lastName" value={form.lastName} onChange={updateForm} placeholder="Apellido" className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">DNI</label>
                            <input name="dni" value={form.dni} onChange={updateForm} placeholder="DNI" className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">Fecha de Nacimiento</label>
                            <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateForm} className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">Teléfono</label>
                            <input name="phone" value={form.phone} onChange={updateForm} placeholder="Teléfono" className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">Dirección</label>
                            <input name="address" value={form.address} onChange={updateForm} placeholder="Dirección" className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">Contraseña</label>
                            <div className="relative">
                                <input 
                                    name="password" 
                                    value={form.password} 
                                    onChange={updateForm} 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Contraseña" 
                                    className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white pr-10 font-medium" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 ml-1">Email</label>
                            <input name="email" value={form.email} onChange={updateForm} placeholder="Email" className="border p-2.5 rounded-xl w-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button onClick={createPatient} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95">Guardar paciente</button>
                        <button onClick={cancelAction} className="bg-slate-400 hover:bg-slate-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-slate-100 transition-all active:scale-95">Cancelar</button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2 items-center mb-5">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, DNI o email..." className="border border-slate-200 p-2.5 rounded-xl w-full md:w-72 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value as 'name' | 'dni' | 'email')} className="border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-600">
                    <option value="name">Ordenar por nombre</option>
                    <option value="dni">Ordenar por DNI</option>
                    <option value="email">Ordenar por email</option>
                </select>
                <button onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95">
                    {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                </button>
                <button onClick={exportCsv} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 active:scale-95 ml-auto">Exportar CSV</button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                    <p className="text-slate-400 font-medium">Cargando pacientes...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">DNI</th>
                                    <th className="p-4">Teléfono</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedFiltered.map((p) => (
                                    <tr key={p.id} className="border-t border-slate-50 hover:bg-indigo-50/20 transition-colors group">
                                        <td className="p-4 font-bold text-slate-700">{p.firstName} {p.lastName}</td>
                                        <td className="p-4 font-medium text-slate-500">{p.dni || '-'}</td>
                                        <td className="p-4 font-medium text-slate-500">{p.phone}</td>
                                        <td className="p-4 font-medium text-slate-500">{p.email}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {p.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-1">
                                            <button 
                                                onClick={() => startEdit(p)} 
                                                disabled={isCreateOpen || (selectedId !== null && selectedId !== p.id)}
                                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${(isCreateOpen || (selectedId !== null && selectedId !== p.id)) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95'}`}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => toggleActive(p)} 
                                                disabled={isCreateOpen || selectedId !== null}
                                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${(isCreateOpen || selectedId !== null) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : (p.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200')}`}
                                            >
                                                {p.isActive ? 'Desactivar' : 'Activar'}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(p)} 
                                                disabled={isCreateOpen || selectedId !== null}
                                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${(isCreateOpen || selectedId !== null) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedId && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Editar paciente</h2>
                                        <p className="text-slate-500 font-medium text-sm">Actualice los datos del registro</p>
                                    </div>
                                    <button onClick={cancelAction} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input name="firstName" value={form.firstName} onChange={updateForm} placeholder="Nombre" className="border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl w-full focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none bg-slate-50 font-bold transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input name="lastName" value={form.lastName} onChange={updateForm} placeholder="Apellido" className="border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl w-full focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none bg-slate-50 font-bold transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">DNI</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input name="dni" value={form.dni} onChange={updateForm} placeholder="DNI" className="border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl w-full focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none bg-slate-50 font-bold transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateForm} className="border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl w-full focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none bg-slate-50 font-bold transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input name="address" value={form.address} onChange={updateForm} placeholder="Dirección" className="border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl w-full focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none bg-slate-50 font-bold transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input name="phone" value={form.phone} onChange={updateForm} placeholder="Teléfono" className="border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl w-full focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none bg-slate-50 font-bold transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input name="email" value={form.email} onChange={updateForm} placeholder="Email" className="border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl w-full focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none bg-slate-50 font-bold transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-10">
                                        <button onClick={saveChanges} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 text-lg">Guardar cambios</button>
                                        <button onClick={cancelAction} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95 text-lg">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
