// =============================================
// UTILIDADES DE NOTIFICACIONES
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import { supabase } from '../lib/supabaseClient';

// Función base para crear notificación
export const crearNotificacion = async (
  userId: string,
  ticketId: number,
  type: string,
  title: string,
  message: string,
  metadata: Record<string, any> = {}
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        ticket_id: ticketId,
        type,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
        metadata
      }]);
    
    if (error) console.error('❌ Error creando notificación:', error);
  } catch (err) {
    console.error('❌ Excepción en notificación:', err);
  }
};

// Notificar a admins cuando se crea ticket
export const notificarNuevoTicket = async (
  ticketId: number, 
  titulo: string, 
  solicitanteId: string
) => {
  // Obtener admins y superadmins
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('rol', ['administrador', 'superadmin']);
  
  if (admins) {
    for (const admin of admins) {
      await crearNotificacion(
        admin.id,
        ticketId,
        'new_ticket',
        '🎫 Nuevo ticket asignado',
        `Ticket #${String(ticketId).padStart(4, '0')}: "${titulo}" requiere atención.`,
        { priority: 'high', solicitanteId }
      );
    }
  }
};

// Notificar nuevo mensaje en chat
export const notificarNuevoMensaje = async (
  participantes: string[], 
  ticketId: number, 
  autorNombre: string,
  titulo: string
) => {
  for (const userId of participantes) {
    await crearNotificacion(
      userId,
      ticketId,
      'new_message',
      '💬 Nuevo mensaje',
      `${autorNombre} comentó en el ticket #${String(ticketId).padStart(4, '0')}: "${titulo}"`,
      {}
    );
  }
};

// Notificar ticket resuelto
export const notificarTicketResuelto = async (
  solicitanteId: string, 
  ticketId: number, 
  titulo: string
) => {
  await crearNotificacion(
    solicitanteId,
    ticketId,
    'ticket_resolved',
    '✅ Ticket resuelto',
    `Tu ticket #${String(ticketId).padStart(4, '0')}: "${titulo}" ha sido marcado como solucionado.`,
    {}
  );
};