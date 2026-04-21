import { useEffect, useState } from 'react';
import api from '../../services/api';

interface UserRow {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/admin/all')
            .then(r => setUsers(r.data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h1 className="text-2xl font-black mb-3">Gestión de Usuarios</h1>
            {loading ? <p>Cargando...</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs"><tr><th className="p-2">Email</th><th className="p-2">Rol</th><th className="p-2">Activo</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="p-2">{u.email}</td><td className="p-2 font-bold">{u.role}</td><td className="p-2">{u.isActive ? 'Sí' : 'No'}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
