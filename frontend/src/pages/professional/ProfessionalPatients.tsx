import { useEffect, useMemo, useState, useRef } from 'react';
import { Search, Printer, User, Fingerprint, Calendar, Phone, MapPin, Mail, Activity, CreditCard, X } from 'lucide-react';
import api from '../../services/api';
import Swal from 'sweetalert2';

interface PatientRow {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    email: string;
    address: string;
    insuranceCompany: string;
    insuranceNumber: string;
    dateOfBirth: string;
    isActive: boolean;
}

export default function ProfessionalPatients() {
    const [patients, setPatients] = useState<PatientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<PatientRow | null>(null);
    const [editForm, setEditForm] = useState({ 
        firstName: '', 
        lastName: '', 
        dni: '', 
        dateOfBirth: '',
        address: '', 
        phone: '', 
        email: '', 
        insuranceCompany: '', 
        insuranceNumber: '' 
    });

    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const dobRef = useRef<HTMLInputElement>(null);

    const profileId = localStorage.getItem('profileId');

    const loadPatients = () => {
        if (!profileId) {
            setMessage('No se encontró ID de profesional.');
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get(`/users/professional/${profileId}/patients`)
            .then((r) => setPatients(r.data))
            .catch(() => setMessage('No se pudieron cargar los pacientes.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPatients(); }, [profileId]);

    const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

    const filtered = useMemo(() => {
        const q = normalize(search);
        let result = patients;
        if (q) {
            result = patients.filter((p) => {
                const fullName = normalize(`${p.firstName} ${p.lastName}`);
                return fullName.includes(q)
                    || normalize(p.firstName).includes(q)
                    || normalize(p.lastName).includes(q)
                    || normalize(p.dni).includes(q)
                    || normalize(p.email).includes(q);
            });
        }
        return [...result].sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    }, [patients, search]);

    const startEdit = (patient: PatientRow) => {
        setEditingPatient(patient);
        setEditForm({
            firstName: patient.firstName,
            lastName: patient.lastName,
            dni: patient.dni,
            dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.substring(0, 10) : '',
            address: patient.address,
            phone: patient.phone,
            email: patient.email,
            insuranceCompany: patient.insuranceCompany || '',
            insuranceNumber: patient.insuranceNumber || '',
        });
        setModalOpen(true);
    };

    const saveEdit = async () => {
        if (!editingPatient) return;
        
        // Validation with focus logic
        if (!editForm.firstName.trim()) {
            firstNameRef.current?.focus();
            return Swal.fire('Error', 'El nombre es obligatorio.', 'error');
        }
        if (!editForm.lastName.trim()) {
            lastNameRef.current?.focus();
            return Swal.fire('Error', 'El apellido es obligatorio.', 'error');
        }
        if (!editForm.dateOfBirth) {
            dobRef.current?.focus();
            return Swal.fire('Error', 'La fecha de nacimiento es obligatoria.', 'error');
        }

        try {
            await api.put(`/users/patient/${editingPatient.id}/profile`, {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                dni: editForm.dni,
                dateOfBirth: editForm.dateOfBirth,
                address: editForm.address,
                phone: editForm.phone,
                email: editForm.email,
                insuranceCompany: editForm.insuranceCompany,
                insuranceNumber: editForm.insuranceNumber,
            });
            
            Swal.fire({
                title: '¡Éxito!',
                text: 'Paciente actualizado correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            setModalOpen(false);
            setEditingPatient(null);
            loadPatients();
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el paciente.', 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Pacientes</h1>
                    <p className="text-slate-500 font-medium mt-1">Gestione la información clínica y de contacto de sus pacientes.</p>
                </div>
                <div className="relative flex-1 max-w-lg flex gap-3">
                    <div className="relative flex-1 print:hidden group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            type="text"
                            placeholder="Buscar por nombre, DNI o email..."
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="print:hidden px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
                        title="Imprimir listado"
                    >
                        <Printer className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
                {message && <div className="m-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">{message}</div>}
                
                {loading ? (
                    <div className="flex flex-col items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando pacientes...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                <tr>
                                    <th className="p-5">Apellido y Nombre</th>
                                    <th className="p-5">DNI</th>
                                    <th className="p-5">Teléfono</th>
                                    <th className="p-5">Obra Social</th>
                                    <th className="p-5">Nro Afiliado</th>
                                    <th className="p-5 print:hidden">Estado</th>
                                    <th className="p-5 text-right print:hidden">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="p-20 text-center text-slate-400 font-medium">No se encontraron pacientes registrados.</td></tr>
                                ) : (
                                    filtered.map((p) => (
                                        <tr key={p.id} className="border-t border-slate-50 hover:bg-indigo-50/20 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-lg tracking-tight">{p.lastName}, {p.firstName}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{p.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 font-bold text-slate-600">{p.dni || '-'}</td>
                                            <td className="p-5 font-medium text-slate-500">{p.phone || '-'}</td>
                                            <td className="p-5">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full uppercase tracking-wider">{p.insuranceCompany || 'Particular'}</span>
                                            </td>
                                            <td className="p-5 font-mono text-xs text-slate-400">{p.insuranceNumber || '-'}</td>
                                            <td className="p-5 print:hidden">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {p.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right print:hidden">
                                                <button
                                                    onClick={() => startEdit(p)}
                                                    className="px-5 py-2 text-xs font-black rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                                >Editar</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && editingPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Editar Paciente</h2>
                                <p className="text-slate-500 font-medium text-sm mt-1">Actualice la información administrativa.</p>
                            </div>
                            <button 
                                onClick={() => { setModalOpen(false); setEditingPatient(null); }} 
                                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            ref={firstNameRef}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-700" 
                                            value={editForm.firstName} 
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))} 
                                            placeholder="Nombre" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            ref={lastNameRef}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-700" 
                                            value={editForm.lastName} 
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))} 
                                            placeholder="Apellido" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI (No editable)</label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                                        <input 
                                            readOnly
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-100 border border-slate-100 outline-none cursor-not-allowed font-bold text-slate-400" 
                                            value={editForm.dni} 
                                            placeholder="DNI" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Nacimiento *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            ref={dobRef}
                                            type="date"
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-700 character-case-upper" 
                                            value={editForm.dateOfBirth} 
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-700" 
                                            value={editForm.phone} 
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} 
                                            placeholder="Teléfono" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-700" 
                                            value={editForm.address} 
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} 
                                            placeholder="Dirección" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Obra Social</label>
                                    <div className="relative">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-700" 
                                            value={editForm.insuranceCompany} 
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, insuranceCompany: e.target.value }))} 
                                            placeholder="Obra Social" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nro Afiliado</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-slate-700" 
                                            value={editForm.insuranceNumber} 
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, insuranceNumber: e.target.value }))} 
                                            placeholder="Número de Afiliado" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (No editable)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                                        <input 
                                            readOnly
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-100 border border-slate-100 outline-none cursor-not-allowed font-bold text-slate-400" 
                                            value={editForm.email} 
                                            placeholder="Email" 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10 flex gap-4">
                                <button onClick={saveEdit} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 text-lg">Guardar Cambios</button>
                                <button onClick={() => { setModalOpen(false); setEditingPatient(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95 text-lg">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
