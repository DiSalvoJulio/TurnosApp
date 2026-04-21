import { useState } from 'react';
import { Search, User, ClipboardList, Calendar, ChevronRight, FileText, UserPlus, X, Mail, MapPin, Phone, Shield, Fingerprint, Printer, Edit3, Save } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
}

interface Evolution {
    id: string;
    date: string;
    note: string;
    professionalName: string;
}

interface PatientHistory {
    patientId: string;
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    address: string;
    insuranceCompany: string;
    insuranceNumber: string;
    dateOfBirth: string;
    evolutions: Evolution[];
}

export default function ClinicalHistory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientHistory | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingEvolution, setEditingEvolution] = useState<Evolution | null>(null);
    const [editedNote, setEditedNote] = useState('');
    const [saving, setSaving] = useState(false);


    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/history/search?query=${searchTerm}`);
            setPatients(data);
            setSelectedPatient(null);
        } catch (error) {
            console.error("Error searching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (patientId: string) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/history/patient/${patientId}`);
            setSelectedPatient(data);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvolution = async () => {
        if (!editingEvolution || !editedNote.trim()) return;
        setSaving(true);
        try {
            await api.put(`/history/evolution/${editingEvolution.id}`, { note: editedNote });
            
            // Update local state
            if (selectedPatient) {
                const updatedEvolutions = selectedPatient.evolutions.map(evo => 
                    evo.id === editingEvolution.id ? { ...evo, note: editedNote } : evo
                );
                setSelectedPatient({ ...selectedPatient, evolutions: updatedEvolutions });
            }
            
            setEditingEvolution(null);
            setEditedNote('');
        } catch (error) {
            console.error("Error updating evolution:", error);
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
            <header className="print:hidden">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Historias Clínicas</h1>
                <p className="text-slate-500 font-medium">Busque pacientes y gestione sus evoluciones clínicas.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Column 1: Search and List */}
                <div className="lg:col-span-1 space-y-6 print:hidden">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Nombre o DNI..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none text-lg transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button 
                            fullWidth 
                            onClick={handleSearch} 
                            className="mt-4 rounded-2xl h-14 font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Search className="w-5 h-5" />
                            Buscar Paciente
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {loading && !selectedPatient && (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                        
                        {patients.map(p => (
                            <button
                                key={p.id}
                                onClick={() => fetchHistory(p.id)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                                    selectedPatient?.patientId === p.id 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100' 
                                    : 'bg-white border-slate-100 hover:border-blue-200 text-slate-700'
                                }`}
                            >
                                <div>
                                    <p className="font-black leading-tight">{p.firstName} {p.lastName}</p>
                                    <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${selectedPatient?.patientId === p.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                        DNI: {p.dni}
                                    </p>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${selectedPatient?.patientId === p.id ? 'text-blue-200' : 'text-slate-200'}`} />
                            </button>
                        ))}

                        {patients.length === 0 && !loading && searchTerm && (
                            <div className="text-center py-10 px-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                                <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-bold text-sm">No se encontraron pacientes.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2 & 3: Selected Patient History */}
                <div className="lg:col-span-2">
                    {selectedPatient ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            {/* Patient Badge */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between print:hidden">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 leading-none">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                                        <div className="flex gap-4 mt-2">
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">DNI: {selectedPatient.dni}</p>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Paciente ID: ...{selectedPatient.patientId.substring(selectedPatient.patientId.length - 6)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="secondary" 
                                        className="rounded-xl px-4 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2 border border-slate-200"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        className="rounded-xl px-4 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                        onClick={() => setShowProfileModal(true)}
                                    >
                                        Ver Perfil completo
                                    </Button>
                                </div>
                            </div>

                            {/* Print header (Only visible when printing) */}
                            <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6 uppercase font-black text-center">
                                <h1 className="text-4xl text-slate-900">Historia Clínica</h1>
                                <p className="text-sm mt-2 text-slate-600">Reporte generado el {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
                            </div>

                            <div className="hidden print:grid grid-cols-2 gap-4 mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-200 text-sm">
                                <div>
                                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-1">Paciente</p>
                                    <p className="text-xl font-black text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                </div>
                                <div>
                                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-1">DNI</p>
                                    <p className="text-xl font-black text-slate-900">{selectedPatient.dni}</p>
                                </div>
                                <div>
                                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-1">Email</p>
                                    <p className="font-bold text-slate-700">{selectedPatient.email}</p>
                                </div>
                                <div>
                                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-1">Teléfono</p>
                                    <p className="font-bold text-slate-700">{selectedPatient.phone}</p>
                                </div>
                                <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-1">Obra Social / Cobertura</p>
                                    <p className="font-bold text-slate-800">{selectedPatient.insuranceCompany || 'Particular'} {selectedPatient.insuranceNumber ? `- Nro: ${selectedPatient.insuranceNumber}` : ''}</p>
                                </div>
                            </div>

                            {/* Timeline of Evolutions */}
                            <div className="relative pl-8 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-slate-100 before:rounded-full print:pl-0 print:before:hidden">
                                {selectedPatient.evolutions.length === 0 ? (
                                    <div className="bg-slate-50/50 p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="font-black text-slate-800 text-xl tracking-tight">Sin evoluciones registradas</p>
                                        <p className="text-slate-500 font-medium italic mt-1">Este paciente aún no tiene notas clínicas.</p>
                                    </div>
                                ) : (
                                    selectedPatient.evolutions.map((evo, idx) => (
                                        <div key={evo.id} className="relative group">
                                            {/* Dot */}
                                            <div className={`absolute -left-9 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-4 ring-slate-100 transition-all ${idx === 0 ? 'bg-blue-600 ring-blue-50' : 'bg-slate-300'} print:hidden`}></div>
                                            
                                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 print:p-0 print:border-none print:shadow-none print:mb-8 print:break-inside-avoid">
                                                <div className="flex items-center justify-between mb-4 print:border-b print:pb-2 print:mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-blue-600 print:w-4 print:h-4 text-black" />
                                                        <span className="font-black text-slate-900 group-hover:text-blue-700 transition-colors print:text-lg">
                                                            {format(new Date(evo.date), "d 'de' MMMM, yyyy", { locale: es })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingEvolution(evo);
                                                                setEditedNote(evo.note);
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest print:hidden shadow-sm"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                            Editar
                                                        </button>
                                                        <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest print:bg-transparent print:text-black print:font-bold">

                                                            Prof. {evo.professionalName}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-50 text-slate-700 italic font-medium leading-relaxed print:p-0 print:bg-transparent print:border-none print:text-slate-900 print:not-italic">
                                                    {evo.note}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (

                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-inner">
                            <ClipboardList className="w-20 h-20 text-slate-200 mb-6" />
                            <h2 className="text-2xl font-black text-slate-400 tracking-tight">Seleccione un paciente</h2>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Utilice el buscador para localizar un paciente y acceder a su historial clínico completo.</p>
                            <div className="mt-8 flex items-center gap-3 text-blue-600/50 text-sm font-bold bg-blue-50/50 px-5 py-3 rounded-2xl">
                                <Search className="w-4 h-4" />
                                Ingrese nombre o DNI en la columna izquierda
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Perfil Completo */}
            {showProfileModal && selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header del Modal */}
                        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 p-8">
                            <button 
                                onClick={() => setShowProfileModal(false)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute -bottom-10 left-8">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white">
                                    <User className="w-12 h-12 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="px-8 pt-16 pb-10">
                            <div className="mb-8">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {selectedPatient.firstName} {selectedPatient.lastName}
                                </h3>
                                <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-1">
                                    Paciente Registrado
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <ProfileField label="DNI" value={selectedPatient.dni} icon={User} />
                                    <ProfileField label="Fecha de Nacimiento" value={selectedPatient.dateOfBirth ? format(new Date(selectedPatient.dateOfBirth), 'dd/MM/yyyy') : '---'} icon={Calendar} />
                                    <ProfileField label="Dirección" value={selectedPatient.address} icon={MapPin} />
                                    <ProfileField label="Teléfono" value={selectedPatient.phone} icon={Phone} />
                                </div>
                                <div className="space-y-6">
                                    <ProfileField label="Obra Social" value={selectedPatient.insuranceCompany || 'Particular'} icon={Shield} />
                                    <ProfileField label="Nro de Afiliado" value={selectedPatient.insuranceNumber || '---'} icon={Fingerprint} />
                                    <ProfileField label="Email" value={selectedPatient.email} icon={Mail} />
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-50">
                                <Button 
                                    fullWidth 
                                    onClick={() => setShowProfileModal(false)}
                                    className="rounded-2xl h-14 font-black bg-slate-900 hover:bg-black text-white transition-all shadow-xl shadow-slate-100"
                                >
                                    Cerrar Perfil
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Editar Evolución */}
            {editingEvolution && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Edit3 className="w-6 h-6 text-blue-600" />
                                    Editar Evolución
                                </h3>
                                <p className="text-slate-500 font-medium text-sm mt-1">
                                    Actualice la nota clínica del {format(new Date(editingEvolution.date), "d 'de' MMMM, yyyy", { locale: es })}
                                </p>
                            </div>
                            <button 
                                onClick={() => setEditingEvolution(null)}
                                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                                Nota Clínica
                            </label>
                            <textarea
                                className="w-full h-64 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-blue-50 focus:border-blue-500 outline-none text-lg transition-all font-medium resize-none leading-relaxed text-slate-700 italic"
                                value={editedNote}
                                onChange={(e) => setEditedNote(e.target.value)}
                                placeholder="Escriba la actualización aquí..."
                            />

                            <div className="mt-8 flex gap-4">
                                <Button 
                                    variant="secondary"
                                    onClick={() => setEditingEvolution(null)}
                                    className="flex-1 rounded-2xl h-14 font-black border-2 border-slate-100 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleUpdateEvolution}
                                    disabled={saving || !editedNote.trim() || editedNote === editingEvolution.note}
                                    className="flex-[2] rounded-2xl h-14 font-black bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

// Subcomponente para los campos del perfil
function ProfileField({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-slate-700 font-bold text-lg leading-tight">{value}</p>
            </div>
        </div>
    );
}
