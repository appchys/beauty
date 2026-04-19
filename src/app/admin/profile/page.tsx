'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Business } from '@/types';
import { uploadProfileImage, compressImage, deleteProfileImage } from '@/lib/storage';

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Business | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    console.log('Profile cambió:', profile);
    if (profile?.logoUrl) {
      console.log('Estableciendo logo preview desde useEffect:', profile.logoUrl);
      setLogoPreview(profile.logoUrl);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      console.log('Perfil cargado:', data.business);
      console.log('Logo URL en el perfil:', data.business?.logoUrl);
      setProfile(data.business);
      
      if (data.business?.logoUrl) {
        console.log('Estableciendo logo preview:', data.business.logoUrl);
        setLogoPreview(data.business.logoUrl);
      } else {
        console.log('No se encontró logoUrl en el perfil');
      }
    } catch (err) {
      setError('Error al cargar el perfil');
      console.error('Error al cargar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError(null);

    try {
      const previousLogoUrl = profile.logoUrl || '';
      let logoUrl = profile.logoUrl || '';

      if (logoFile) {
        const compressedFile = await compressImage(logoFile, 800, 800, 0.85);
        logoUrl = await uploadProfileImage(compressedFile, profile.id);
      }

      const updatedProfile = { ...profile, logoUrl };
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      const updatedData = await response.json();

      if (!response.ok) {
        throw new Error(updatedData?.error || 'Failed to update profile');
      }

      setProfile(updatedData.business);
      setLogoFile(null);
      if (updatedData.business?.logoUrl) {
        setLogoPreview(updatedData.business.logoUrl);
      }

      if (logoFile && previousLogoUrl && previousLogoUrl !== logoUrl) {
        await deleteProfileImage(previousLogoUrl);
      }

      router.push('/admin');
    } catch (err) {
      setError('Error al actualizar el perfil');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="text-red-500 py-4">{error}</CardContent>
        </Card>
      </div>
    );
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Perfil del Negocio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de imagen/logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo del negocio
              </label>
              <div className="flex flex-col items-center space-y-4">
                <div 
                  onClick={triggerFileInput}
                  className="cursor-pointer"
                >
                  {logoPreview ? (
                    <div className="relative group">
                      <div className="h-32 w-32 relative">
                        <Image
                          src={logoPreview}
                          alt="Logo del negocio"
                          fill
                          className="object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                          sizes="128px"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">Cambiar imagen</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="text-gray-500 text-sm text-center px-4">
                        Click para subir logo
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  aria-describedby="logo-help"
                />
                <p id="logo-help" className="text-xs text-gray-500">
                  Formato: JPG, PNG. Tamaño máximo: 2MB
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Negocio
              </label>
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={profile?.description || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={profile?.address || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, address: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={profile?.phone || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, phone: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, email: e.target.value } : prev
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
