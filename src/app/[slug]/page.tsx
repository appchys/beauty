'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Business, Service } from '@/types';
import { 
  Phone, 
  MapPin, 
  Calendar, 
  Scissors, 
  Clock, 
  Star,
  ChevronRight,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function PublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // We'll fetch from a new public API route
        const response = await fetch(`/api/public/profile/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Negocio no encontrado');
          } else {
            setError('Error al cargar el perfil');
          }
          return;
        }
        
        const data = await response.json();
        setBusiness(data.business);
        setServices(data.services);
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)]">
        <div className="text-center p-8 glass-panel rounded-2xl max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{error || 'No encontrado'}</h1>
          <p className="text-gray-600 mb-6 font-medium">Lo sentimos, no pudimos encontrar el perfil que buscas.</p>
          <Link href="/" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-all shadow-lg">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Hero Section / Business Header */}
      <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-purple-600 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute right-20 bottom-10 w-60 h-60 bg-pink-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center px-4">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white transition-transform group-hover:scale-105 duration-300">
              {business.logoUrl ? (
                <Image 
                  src={business.logoUrl} 
                  alt={business.name} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600">
                  <Star size={48} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="mt-20 pt-4 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
          {business.name}
        </h1>
        {business.description && (
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
            {business.description}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {business.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-all shadow-sm">
              <Phone size={18} />
              <span className="font-medium">{business.phone}</span>
            </a>
          )}
          {business.address && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 text-gray-700 shadow-sm">
              <MapPin size={18} />
              <span className="font-medium">{business.address}</span>
            </div>
          )}
          <button className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/30 font-bold group">
            <Calendar size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Agendar Cita</span>
          </button>
        </div>
      </div>

      {/* Services List */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scissors className="text-purple-600" />
            Nuestros Servicios
          </h2>
          <div className="h-0.5 flex-1 bg-gray-200 ml-4"></div>
        </div>

        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex gap-4"
              >
                <div className="w-20 h-20 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden relative border border-gray-100">
                  {service.photo ? (
                    <Image src={service.photo} alt={service.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Scissors size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{service.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {service.duration} min
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md font-bold">
                      ${service.price}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Info size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay servicios disponibles por el momento.</p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-20 text-center text-gray-400 text-sm">
        <p>Potenciado por <span className="font-bold text-purple-600">BeautyPoints</span></p>
      </div>
    </div>
  );
}
