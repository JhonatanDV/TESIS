import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    
    try {
      await register(name, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-6 text-center text-slate-800 dark:text-white">Crear una Cuenta</h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <Input
        label="Nombre Completo"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ingresa tu nombre completo"
      />
      
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
        placeholder="Crea una contraseña"
      />
      
      <Input
        label="Confirmar Contraseña"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        placeholder="Confirma tu contraseña"
      />
      
      <Button
        type="submit"
        fullWidth
        loading={loading}
      >
        Registrarse
      </Button>
    </form>
  );
};

export default Register;