-- =============================================
-- TABLA: user_preferences
-- Módulo de Configuración Global - Sistema de Tickets BAP
-- =============================================
-- Ejecutar este script en el SQL Editor de Supabase.
-- Crea la tabla donde se guardan las preferencias individuales
-- de cada usuario (Notificaciones, Tickets, Apariencia).

create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,

  -- Notificaciones
  email_al_asignar_ticket boolean not null default true,
  sonido_nuevo_mensaje boolean not null default true,
  alerta_sla_por_vencer boolean not null default true,

  -- Tickets
  vista_tickets text not null default 'cola_general'
    check (vista_tickets in ('cola_general', 'lista', 'tarjetas')),
  tickets_por_pagina integer not null default 15
    check (tickets_por_pagina in (15, 30, 50)),
  auto_actualizar integer not null default 60
    check (auto_actualizar in (0, 30, 60, 120, 300)),

  -- Apariencia
  modo_oscuro boolean not null default false,
  tamano_texto integer not null default 100
    check (tamano_texto between 80 and 150),
  lector_pantalla boolean not null default false,
  contraste_imagenes boolean not null default false,
  tamano_botones integer not null default 100
    check (tamano_botones between 80 and 150),

  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- =============================================
-- SEGURIDAD: cada usuario solo ve y edita sus propias preferencias
-- =============================================
alter table public.user_preferences enable row level security;

drop policy if exists "Usuarios ven sus propias preferencias" on public.user_preferences;
create policy "Usuarios ven sus propias preferencias"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios crean sus propias preferencias" on public.user_preferences;
create policy "Usuarios crean sus propias preferencias"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios actualizan sus propias preferencias" on public.user_preferences;
create policy "Usuarios actualizan sus propias preferencias"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- Nota: la app usa upsert (onConflict: 'user_id'), así que esta tabla
-- soporta tanto la primera vez que un usuario guarda sus preferencias
-- (insert) como las siguientes (update), sin necesidad de lógica extra.
-- =============================================
