// =============================================
// UTILIDADES DE NOTIFICACIONES — BAP
// =============================================

import { supabase } from '../lib/supabaseClient';

export const crearNotificacion = async (
  userId: string,
  ticketId: number | null,
  type: string,
  title: string,
  message: string,
  metadata: Record<string, any> = {}
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, ticket_id: ticketId, type, title, message, is_read: false, metadata }]);
    if (error) console.error('Error creando notificación:', error);
  } catch (err) {
    console.error('Excepción en notificación:', err);
  }
};

export const notificarNuevoTicket = async (ticketId: number, titulo: string, solicitanteId: string) => {
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('rol', ['administrador', 'superadmin'])
    .eq('activo', true);

  if (admins) {
    for (const admin of admins) {
      if (admin.id === solicitanteId) continue; // no notificar al solicitante si es admin
      await crearNotificacion(
        admin.id, ticketId, 'new_ticket',
        '🎫 Nuevo ticket',
        `Ticket #${String(ticketId).padStart(4, '0')}: "${titulo}" requiere atención.`,
        { solicitanteId }
      );
    }
  }
};

export const notificarNuevoMensaje = async (
  participantes: string[],
  autorId: string,
  ticketId: number,
  autorNombre: string,
  tituloTicket: string
) => {
  for (const userId of participantes) {
    if (userId === autorId) continue; // no notificar al propio autor
    await crearNotificacion(
      userId, ticketId, 'new_message',
      '💬 Nuevo mensaje',
      `${autorNombre} comentó en #${String(ticketId).padStart(4, '0')}: "${tituloTicket}"`,
      {}
    );
  }
};

export const notificarTicketAsignado = async (tecnicoId: string, ticketId: number, titulo: string) => {
  await crearNotificacion(
    tecnicoId, ticketId, 'ticket_assigned',
    '🔧 Ticket asignado',
    `Se te asignó el ticket #${String(ticketId).padStart(4, '0')}: "${titulo}".`,
    {}
  );
};

export const notificarTicketTomado = async (
  participantes: string[],
  tecnicoNombre: string,
  ticketId: number,
  titulo: string
) => {
  for (const userId of participantes) {
    await crearNotificacion(
      userId, ticketId, 'ticket_taken',
      '👷 Ticket tomado',
      `${tecnicoNombre} tomó el ticket #${String(ticketId).padStart(4, '0')}: "${titulo}".`,
      {}
    );
  }
};

export const notificarTicketResuelto = async (solicitanteId: string, ticketId: number, titulo: string) => {
  await crearNotificacion(
    solicitanteId, ticketId, 'ticket_resolved',
    '✅ Ticket resuelto',
    `Tu ticket #${String(ticketId).padStart(4, '0')}: "${titulo}" fue marcado como resuelto.`,
    {}
  );
};
