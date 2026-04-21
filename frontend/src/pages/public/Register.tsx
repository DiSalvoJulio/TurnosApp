import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';

export default function Register() {
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({ role: 'PATIENT', firstName: '', lastName: '', specialty: '', dni: '', address: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const role = searchParams.get('role');
        if (role === 'PROFESSIONAL' || role === 'PATIENT') {
            setForm(prev => ({ ...prev, role }));
        }
    }, [searchParams]);

    useEffect(() => {
        const loadSpecialties = async () => {
            try {
                const { data } = await api.get<any[]>('/professions');
                const activeNames = data.filter(p => p.isActive).map(p => p.name);
                if (activeNames.length > 0) {
                    setSpecialties(activeNames);
                    if (!form.specialty) setForm(prev => ({ ...prev, specialty: activeNames[0] }));
                }
            } catch {
                setSpecialties([]);
            }
        };

        loadSpecialties();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden.');
        setLoading(true); setError('');

        try {
            if (form.role === 'PATIENT') {
                await api.post('/auth/register/patient', {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    dni: form.dni,
                    address: form.address,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                });
            } else {
                await api.post('/auth/register/professional', {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    dni: form.dni,
                    address: form.address,
                    specialty: form.specialty,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    worksWeekends: true,
                });
            }
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data || 'Error al registrarse. Intente nuevamente.');
        } finally { setLoading(false); }
    };

    const field = (label: string, name: keyof typeof form, type = 'text') => (
        <div className="space-y-1">
            <label className="block font-semibold text-slate-700">{label}</label>
            <input
                type={type} name={name} required
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none text-lg transition-all"
                value={(form[name] ?? '') as string} onChange={handleChange}
            />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4">
            <div className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                <button onClick={() => navigate('/login')} className={`mb-6 font-medium hover:underline ${form.role === 'PROFESSIONAL' ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-600 hover:text-emerald-700'}`}>← Volver al inicio</button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Crear cuenta</h1>
                <p className="text-slate-500 mb-8">Complete sus datos para registrarse.</p>

                {error && <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {form.role === 'PATIENT' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {field('Nombre', 'firstName')}
                                {field('Apellido', 'lastName')}
                                {field('DNI', 'dni')}
                                {field('Dirección', 'address')}
                                {field('Teléfono', 'phone', 'tel')}
                                {field('Correo electrónico', 'email', 'email')}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {field('Contraseña', 'password', 'password')}
                                {field('Repetir contraseña', 'confirmPassword', 'password')}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {field('Nombre', 'firstName')}
                                {field('Apellido', 'lastName')}
                                {field('DNI', 'dni')}
                                {field('Dirección', 'address')}
                                {field('Teléfono', 'phone', 'tel')}
                                <div className="space-y-1">
                                    <label className="block font-semibold text-slate-700">Especialidad</label>
                                    <select
                                        name="specialty"
                                        required
                                        value={form.specialty}
                                        onChange={handleChange}
                                        className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none text-lg transition-all"
                                    >
                                        {specialties.length > 0 ? specialties.map(s => <option key={s} value={s}>{s}</option>) : <option value="">Sin especialidades</option>}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block font-semibold text-slate-700 mb-1">Correo electrónico</label>
                                    <input
                                        type="email" name="email" required
                                        className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none text-lg transition-all"
                                        value={form.email} onChange={handleChange}
                                    />
                                </div>
                                {field('Contraseña', 'password', 'password')}
                                {field('Repetir contraseña', 'confirmPassword', 'password')}
                            </div>
                        </>
                    )}

                    <Button fullWidth type="submit" disabled={loading} className={`mt-4 text-xl py-5 ${form.role === 'PROFESSIONAL' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}>
                        {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-slate-500">
                    ¿Ya tenés cuenta?{' '}
                    <button onClick={() => navigate('/login')} className={`font-semibold hover:underline ${form.role === 'PROFESSIONAL' ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-600 hover:text-emerald-700'}`}>Iniciar sesión</button>
                </p>
            </div>
        </div>
    );
}
