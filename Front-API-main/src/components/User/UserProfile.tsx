import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import { UserCircle, Upload, Shield, ShieldAlert, Trash2 } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { currentUser, logout, updateUserPhoto, getAllUsers, updateUserRole, deleteUser } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoUrl || '');
  const [showUserManagement, setShowUserManagement] = useState(false);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (currentUser) {
        if (photoUrl !== currentUser.photoUrl) {
          await updateUserPhoto(currentUser.id, photoUrl);
        }
        
        setSuccess('Perfil actualizado exitosamente');
        setIsEditing(false);
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateUserRole(userId, newRole);
      setSuccess(`Rol de usuario actualizado exitosamente`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la cuenta de ${userName}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteUser(userId);
        setSuccess('Usuario eliminado exitosamente');
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-col items-center pb-6">
          <div className="h-24 w-24 rounded-full overflow-hidden mb-4 relative group">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={currentUser?.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                <UserCircle className="h-14 w-14 text-blue-600 dark:text-blue-300" />
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            {currentUser?.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {currentUser?.email}
          </p>
          <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full dark:bg-blue-900/50 dark:text-blue-300">
            {currentUser?.role.charAt(0).toUpperCase() + currentUser?.role.slice(1)}
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Miembro desde {formatDate(currentUser?.createdAt || '')}
          </p>
        </div>
        
        {success && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg dark:bg-green-900/30 dark:text-green-300">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        
        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-800 mb-4 dark:text-white">
            Información de la Cuenta
          </h3>
          
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Nombre Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              
              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="URL de Foto de Perfil"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg"
              />
              
              <div className="border-t border-slate-200 pt-4 mt-6 dark:border-slate-700">
                <h4 className="text-md font-medium text-slate-800 mb-4 dark:text-white">
                  Cambiar Contraseña (Opcional)
                </h4>
                
                <Input
                  label="Contraseña Actual"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                
                <Input
                  label="Nueva Contraseña"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                
                <Input
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nombre Completo</p>
                <p className="text-slate-800 dark:text-white">{currentUser?.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Correo Electrónico</p>
                <p className="text-slate-800 dark:text-white">{currentUser?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Cuenta Creada</p>
                <p className="text-slate-800 dark:text-white">
                  {formatDate(currentUser?.createdAt || '')}
                </p>
              </div>
              
              <div className="pt-4 flex space-x-3">
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
                <Button variant="outline" onClick={logout}>
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Section - User Management */}
      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">
              Gestión de Usuarios
            </h3>
            <Button
              variant="outline"
              onClick={() => setShowUserManagement(!showUserManagement)}
            >
              {showUserManagement ? 'Ocultar Usuarios' : 'Mostrar Usuarios'}
            </Button>
          </div>

          {showUserManagement && (
            <div className="space-y-4">
              {getAllUsers().map(user => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg dark:border-slate-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      {user.photoUrl ? (
                        <img 
                          src={user.photoUrl} 
                          alt={user.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                          <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{user.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Registrado {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </div>
                    {user.id !== currentUser.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleUpdate(
                            user.id,
                            user.role === 'admin' ? 'user' : 'admin'
                          )}
                          icon={user.role === 'admin' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        >
                          Hacer {user.role === 'admin' ? 'Usuario' : 'Admin'}
                        </Button>
                        {user.role === 'user' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            icon={<Trash2 className="h-4 w-4 text-red-500" />}
                          >
                            Eliminar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;