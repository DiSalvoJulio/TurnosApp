import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';
import { User, Save, MapPin, Phone, Mail, CreditCard, ChevronLeft, CheckCircle, AlertCircle, Shield, Fingerprint, Calendar, Lock, Eye, EyeOff, Edit3, X, Camera } from 'lucide-react';

interface Profile {
    firstName: string;
    lastName: string;
    dni: string;
    address: string;
    email: string;
    phone: string;
    insuranceCompany: string;
    insuranceNumber: string;
    dateOfBirth: string;
    profilePictureUrl?: string;
    password?: string;
}

export default function PatientProfile() {
    const [profile, setProfile] = useState<Profile>({ 
        firstName: '', lastName: '', dni: '', address: '', 
        email: '', phone: '', insuranceCompany: '', insuranceNumber: '',
        dateOfBirth: ''
    });

    const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
    const [inputErrors, setInputErrors] = useState<Partial<Record<keyof Profile | 'confirmPassword', string>>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [initialProfile, setInitialProfile] = useState<Profile | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const patientId = localStorage.getItem('profileId');

    useEffect(() => {
        api.get(`/users/patient/${patientId}/profile`)
            .then(r => {
                const data = r.data;
                if (data.dateOfBirth) data.dateOfBirth = data.dateOfBirth.substring(0, 10);
                setProfile(data);
                setInitialProfile({...data});
            })
            .catch(() => setError('No se pudo cargar el perfil.'))
            .finally(() => setLoading(false));
    }, [patientId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Per-input validation
        const newErrors: Partial<Record<keyof Profile | 'confirmPassword', string>> = {};
        const requiredFields: (keyof Profile)[] = ['firstName', 'lastName', 'address', 'phone', 'insuranceCompany', 'insuranceNumber', 'dateOfBirth'];
        
        requiredFields.forEach(f => {
            if (!profile[f] || profile[f].toString().trim() === '') {
                newErrors[f] = 'Campo obligatorio.';
            }
        });

        // Password only mandatory if one of the fields is filled
        if (passwords.password || passwords.confirmPassword) {
            if (!passwords.password) newErrors.password = 'Campo obligatorio.';
            if (!passwords.confirmPassword) newErrors.confirmPassword = 'Campo obligatorio.';
            if (passwords.password && passwords.confirmPassword && passwords.password !== passwords.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden.';
            }
        }

        setInputErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            // Find first failing field and focus
            const firstFailing = Object.keys(newErrors)[0];
            const input = document.getElementsByName(firstFailing)[0] as HTMLInputElement;
            if (input) input.focus();
            setError('Por favor corrija los errores indicados.');
            return;
        }

        setSaving(true); setSaved(false); setError('');
        try {
            await api.put(`/users/patient/${patientId}/profile`, {
                ...profile,
                password: passwords.password || null
            });
            localStorage.setItem('firstName', profile.firstName);
            setInitialProfile({...profile});
            setSaved(true);
            setIsEditing(false);
            Swal.fire({
                title: '¡Perfil Actualizado!',
                text: 'Tus datos se han guardado correctamente.',
                icon: 'success',
                confirmButtonColor: '#10b981'
            });
            setTimeout(() => setSaved(false), 3000);
        } catch { setError('Error al guardar los cambios.'); }
        finally { setSaving(false); }
    };

    const handleCancel = () => {
        if (initialProfile) {
            setProfile(initialProfile);
        }
        setPasswords({ password: '', confirmPassword: '' });
        setIsEditing(false);
        setError('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo y tamaño (opcional pero recomendado)
        if (!file.type.startsWith('image/')) {
            Swal.fire('Error', 'Por favor selecciona una imagen válida.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setSaving(true);
        try {
            const res = await api.post(`/users/${patientId}/profile-picture`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newUrl = res.data.url;
            setProfile(prev => ({ ...prev, profilePictureUrl: newUrl }));
            if (initialProfile) setInitialProfile({ ...initialProfile, profilePictureUrl: newUrl });
            localStorage.setItem('profilePictureUrl', newUrl);
            
            Swal.fire({
                title: '¡Foto actualizada!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire('Error', 'No se pudo subir la imagen.', 'error');
        } finally {
            setSaving(false);
        }
    };


    const field = (label: string, name: keyof Profile | 'password' | 'confirmPassword', icon: any, type = 'text', readOnly = false) => {
        const Icon = icon;
        const hasError = !!inputErrors[name];
        const isPassword = name === 'password' || name === 'confirmPassword';
        const showPass = name === 'password' ? showPassword : showConfirmPassword;
        const setShowPass = name === 'password' ? setShowPassword : setShowConfirmPassword;

        return (
            <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">{label}</label>
                <div className="relative group">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-600 transition-colors ${hasError ? 'text-red-500' : 'text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <input
                        type={isPassword ? (showPass ? 'text' : 'password') : type} 
                        name={name} 
                        readOnly={readOnly}
                        placeholder={isPassword ? 'Ingrese su contraseña' : ''}
                        className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl focus:bg-white focus:ring-4 outline-none text-lg transition-all font-medium 
                            ${readOnly ? 'opacity-70 cursor-not-allowed' : ''} 
                            ${hasError ? 'border-red-500 focus:ring-red-50 focus:border-red-500 bg-red-50/10' : 'border-slate-100 focus:ring-emerald-50 focus:border-emerald-500'}`}
                        value={isPassword ? passwords[name as 'password' | 'confirmPassword'] : (profile[name as keyof Profile] as string)} 
                        onChange={isPassword ? (e) => {
                            handlePasswordChange(e);
                            if (inputErrors[name]) setInputErrors(prev => ({...prev, [name]: undefined}));
                        } : (e) => {
                            handleChange(e);
                            if (inputErrors[name]) setInputErrors(prev => ({...prev, [name]: undefined}));
                        }}
                    />
                    {isPassword && !readOnly && (
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    )}
                </div>
                {hasError && <p className="text-xs text-red-500 font-bold ml-1">{inputErrors[name]}</p>}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-24">
            <header className="mb-12">
                <button onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Inicio
                </button>
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-2">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-inner overflow-hidden border-4 border-white shadow-xl">
                            {profile.profilePictureUrl ? (
                                <img 
                                    src={`http://localhost:5005${profile.profilePictureUrl}`} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-16 h-16" />
                            )}
                        </div>
                        {isEditing && (
                            <label className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-white text-emerald-600 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-emerald-50 transition-all active:scale-90 border border-slate-100">
                                <Camera className="w-6 h-6" />
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            {profile.firstName} {profile.lastName}
                        </h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-3">Mi Perfil de Paciente</p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando datos...</p>
                </div>
            ) : (
                <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>

                    {error && (
                        <div className="p-4 mb-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-bold text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {saved && (
                        <div className="p-4 mb-8 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-bold text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <CheckCircle className="w-5 h-5" />
                            ¡Perfil actualizado correctamente!
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {field('Nombre', 'firstName', User, 'text', !isEditing)}
                        {field('Apellido', 'lastName', User, 'text', !isEditing)}
                        
                        <div>
                            {field('DNI', 'dni', CreditCard, 'text', true)}
                            <p className="mt-2 ml-1 text-[10px] text-slate-400 font-medium italic">* Solo modificable por administración.</p>
                        </div>
                        {field('Fecha de Nacimiento', 'dateOfBirth', Calendar, 'date', !isEditing)}

                        {field('Dirección', 'address', MapPin, 'text', !isEditing)}
                        {field('Teléfono', 'phone', Phone, 'tel', !isEditing)}
                        
                        {field('Obra Social', 'insuranceCompany', Shield, 'text', !isEditing)}
                        {field('Nro Afiliado', 'insuranceNumber', Fingerprint, 'text', !isEditing)}

                        <div className="md:col-span-2">
                            {field('Correo electrónico', 'email', Mail, 'email', true)}
                            <p className="mt-2 ml-1 text-[10px] text-slate-400 font-medium italic">* Solo modificable por administración.</p>
                        </div>
                    </div>

                    <div className="pt-8 mb-10 border-t border-slate-50">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-emerald-600" />
                            Seguridad
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {field('Nueva Contraseña', 'password', Lock, 'password', !isEditing)}
                            {field('Repetir Contraseña', 'confirmPassword', Lock, 'password', !isEditing)}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50">
                        {!isEditing ? (
                            <Button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="flex-1 rounded-2xl py-4 text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Edit3 className="w-6 h-6" />
                                Editar Perfil
                            </Button>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCancel}
                                    className="flex-1 rounded-2xl py-4 text-lg font-black border-2 border-slate-100 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                    Cancelar
                                </Button>
                                <Button
                                    disabled={saving}
                                    className="flex-[2] rounded-2xl py-4 text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-6 h-6" />
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
