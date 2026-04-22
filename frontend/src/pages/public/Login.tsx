import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { User, Activity, ArrowLeft, Lock, Mail, Calendar, LayoutDashboard, KeyRound, Send } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login() {
    const [roleMode, setRoleMode] = useState<'PATIENT' | 'PROFESSIONAL' | 'ADMIN' | null>(null);
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [email, setEmail] = useState('');
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSelectRole = (role: 'PATIENT' | 'PROFESSIONAL' | 'ADMIN') => {
        setRoleMode(role);
        setForgotPasswordMode(false);
        setError('');
        if (role === 'PATIENT') {
            setEmail('paciente@turnos.com');
            setPassword('123');
        } else if (role === 'PROFESSIONAL') {
            setEmail('juanperez@turnos.com');
            setPassword('123');
        } else {
            setEmail('admin@turnos.com');
            setPassword('123');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('profileId', data.profileId ?? '');
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('firstName', data.firstName ?? '');
            localStorage.setItem('profilePictureUrl', data.profilePictureUrl ?? '');

            if (data.role === 'PATIENT') navigate('/patient/dashboard');
            else if (data.role === 'PROFESSIONAL') navigate('/professional/dashboard');
            else if (data.role === 'ADMIN') navigate('/admin/dashboard');
            else navigate('/');
        } catch (err: any) {
            const message = err?.response?.data ?? 'Credenciales inválidas o error de conexión.';
            setError(typeof message === 'string' ? message : 'Credenciales inválidas o error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleRecoverySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recoveryEmail)) {
            Swal.fire('Error', 'El formato del correo electrónico no es válido.', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: recoveryEmail });
            Swal.fire({
                title: 'Correo enviado',
                text: 'Si el email existe en nuestro sistema, recibirá un correo para restablecer su contraseña.',
                icon: 'success',
                confirmButtonColor: '#3b82f6'
            });
            setForgotPasswordMode(false);
        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al procesar tu solicitud.',
                icon: 'error',
                confirmButtonColor: '#3b82f6'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-blue-50/50 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-emerald-50/50 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="max-w-4xl w-full mx-4 flex flex-col md:flex-row bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px]">

                {/* Lateral Info Panel */}
                <div className="w-full md:w-5/12 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-12">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter">TurnosApp</span>
                        </div>

                        <h2 className="text-4xl font-black leading-tight mb-6">
                            Tu salud, <br />
                            <span className="text-indigo-400">organizada.</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-lg leading-relaxed">
                            Gestioná tus citas médicas con la plataforma más avanzada y sencilla del mercado.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <div className="flex -space-x-3 mb-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <User className="w-6 h-6 text-slate-500" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-xs font-bold">
                                +2k
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Confiado por profesionales</p>
                    </div>
                </div>

                {/* Login Interaction Area */}
                <div className="w-full md:w-7/12 p-8 md:p-14 flex flex-col justify-center bg-white">
                    {!roleMode ? (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Bienvenido de nuevo</h3>
                                <p className="text-slate-500 font-medium">Seleccioná cómo deseás ingresar hoy</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => handleSelectRole('PATIENT')}
                                    className="group flex items-center p-6 border-2 border-slate-50 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div className="ml-6 text-left">
                                        <h4 className="text-xl font-black text-slate-900 leading-none mb-1">Soy Paciente</h4>
                                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Ver mis turnos</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleSelectRole('PROFESSIONAL')}
                                    className="group flex items-center p-6 border-2 border-slate-50 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <div className="ml-6 text-left">
                                        <h4 className="text-xl font-black text-slate-900 leading-none mb-1">Soy Profesional</h4>
                                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest group-hover:text-blue-500 transition-colors">Gestionar mi agenda</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleSelectRole('ADMIN')}
                                    className="group flex items-center p-6 border-2 border-slate-50 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <LayoutDashboard className="w-8 h-8" />
                                    </div>
                                    <div className="ml-6 text-left">
                                        <h4 className="text-xl font-black text-slate-900 leading-none mb-1">Soy Admin</h4>
                                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Gestión del sistema</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-left-8 duration-500">
                            <button
                                onClick={() => {
                                    if (forgotPasswordMode) setForgotPasswordMode(false);
                                    else setRoleMode(null);
                                }}
                                className="mb-10 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm uppercase tracking-widest"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver atrás
                            </button>

                            {forgotPasswordMode ? (
                                <div className="space-y-8 animate-in zoom-in-95 duration-300">
                                    <div>
                                        <div className="inline-flex p-3 rounded-2xl mb-4 bg-amber-100 text-amber-600">
                                            <KeyRound className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Recuperar Contraseña</h3>
                                        <p className="text-slate-500 font-medium">Ingresá tu correo para recibir las instrucciones</p>
                                    </div>

                                    <form onSubmit={handleRecoverySubmit} className="space-y-6">
                                        <div className="space-y-2 group">
                                            <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Tu correo electrónico</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                                <input
                                                    type="email" required
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-amber-50 focus:border-amber-500 outline-none transition-all font-medium text-lg placeholder:text-slate-300"
                                                    placeholder="ejemplo@correo.com"
                                                    value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            fullWidth
                                            type="submit"
                                            className="mt-4 py-6 text-lg font-black rounded-2xl shadow-xl bg-slate-900 hover:bg-black shadow-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-5 h-5" />
                                            Enviar mail de recuperación
                                        </Button>
                                    </form>

                                    <div className="text-center">
                                        <button 
                                            onClick={() => setForgotPasswordMode(false)}
                                            className="text-slate-400 font-bold hover:text-slate-900 transition-colors text-sm uppercase tracking-widest"
                                        >
                                            Cancelar y volver al login
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-10">
                                        <div className={`inline-flex p-3 rounded-2xl mb-4 ${roleMode === 'PATIENT' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {roleMode === 'PATIENT' ? <User className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                                            Acceso {roleMode === 'PATIENT' ? 'Paciente' : roleMode === 'PROFESSIONAL' ? 'Profesional' : 'Admin'}
                                        </h3>
                                        <p className="text-slate-500 font-medium">Ingresá tus credenciales para continuar</p>
                                    </div>

                                    {error && (
                                        <div className="p-4 mb-8 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-bold text-sm flex items-center gap-3">
                                            <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">!</div>
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleLogin} className="space-y-6">
                                        <div className="space-y-2 group">
                                            <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Correo o DNI</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    type="text" required
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium text-lg"
                                                    placeholder="ejemplo@correo.com"
                                                    value={email} onChange={e => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 group">
                                            <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Contraseña</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    type="password" required
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium text-lg"
                                                    placeholder="••••••••"
                                                    value={password} onChange={e => setPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            fullWidth
                                            type="submit"
                                            disabled={loading}
                                            className={`mt-4 py-6 text-lg font-black rounded-2xl shadow-xl transition-all active:scale-95 ${roleMode === 'PATIENT'
                                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                                }`}
                                        >
                                            {loading ? 'Validando...' : 'Iniciar Sesión'}
                                        </Button>
                                    </form>

                                    <div className="mt-8 space-y-4">
                                        {(roleMode === 'PATIENT' || roleMode === 'PROFESSIONAL') && (
                                            <p className="text-center text-slate-500 font-bold">
                                                ¿Aún no tenés cuenta?{' '}
                                                <button onClick={() => navigate(`/register?role=${roleMode}`)} className={`${roleMode === 'PROFESSIONAL' ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-600 hover:text-emerald-700'} hover:underline`}>Registrate ahora</button>
                                            </p>
                                        )}
                                        
                                        <div className="text-center">
                                            <button 
                                                onClick={() => setForgotPasswordMode(true)}
                                                className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest border-b border-transparent hover:border-slate-300 pb-0.5"
                                            >
                                                ¿Olvidaste tu contraseña? Recuperar ahora
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
