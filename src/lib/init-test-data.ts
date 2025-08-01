import { createUser, createBusiness, createLoyaltyCard } from '@/lib/firestore';

export async function initializeTestData() {
  try {
    console.log('🚀 Inicializando datos de prueba...');

    // Crear usuario admin
    console.log('👤 Creando usuario admin...');
    const adminUser = await createUser({
      email: 'admin@beauty.com',
      name: 'Admin Beauty',
      role: 'admin'
    });
    console.log('✅ Admin creado:', adminUser.id);

    // Crear usuario cliente
    console.log('👤 Creando usuario cliente...');
    const clientUser = await createUser({
      email: 'cliente@gmail.com',
      name: 'Cliente Test',
      role: 'client'
    });
    console.log('✅ Cliente creado:', clientUser.id);

    // Crear negocio de prueba
    console.log('🏪 Creando negocio de prueba...');
    const business = await createBusiness({
      name: 'Beauty Salon Deluxe',
      description: 'El mejor salón de belleza de la ciudad',
      address: 'Centro Comercial Plaza Mayor',
      phone: '+1234567890',
      email: 'info@beautysalon.com',
      logo: '/api/placeholder/200/200',
      adminId: adminUser.id
    });
    console.log('✅ Negocio creado:', business.id);

    // Crear tarjeta de lealtad
    console.log('🎫 Creando tarjeta de lealtad...');
    const loyaltyCard = await createLoyaltyCard({
      businessId: business.id,
      name: 'Tarjeta VIP Beauty',
      description: '10 servicios = 1 gratis',
      requiredStickers: 10,
      rewardDescription: 'Servicio gratuito de tu elección',
      isActive: true
    });
    console.log('✅ Tarjeta de lealtad creada:', loyaltyCard.id);

    console.log('🎉 Datos de prueba inicializados correctamente!');
    
    return {
      adminUser,
      clientUser,
      business,
      loyaltyCard
    };
  } catch (error) {
    console.error('❌ Error al inicializar datos:', error);
    throw error;
  }
}
