import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-6 text-center text-slate-800 dark:text-white">Iniciar Sesión</h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      
      <Input
        label="Correo Electrónico"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Ingresa tu correo"
      />
      
      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="Ingresa tu contraseña"
      />
      
      <Button
        type="submit"
        fullWidth
        loading={loading}
      >
        Ingresar
      </Button>
    </form>
  );
};

export default Login;