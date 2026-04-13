-- Crea tabla de transacciones de pago para integraciones con pasarelas online.
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  profesor_id uuid REFERENCES auth.users(id),
  club_id bigint REFERENCES public.clubs(id),
  student_package_id bigint REFERENCES public.student_packages(id),
  reserva_cancha_id bigint REFERENCES public.reservas_cancha(id),
  payer_user_id uuid REFERENCES auth.users(id),
  payer_email text,
  gateway text NOT NULL CHECK (gateway IN ('mercadopago', 'stripe')),
  gateway_payment_id text UNIQUE,
  gateway_status text NOT NULL DEFAULT 'pending' CHECK (
    gateway_status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')
  ),
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'ARS',
  raw_webhook jsonb,
  webhook_received_at timestamptz
);

-- Habilita RLS para controlar lectura de transacciones por rol funcional.
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Limpia políticas previas si existieran para mantener la migración idempotente.
DROP POLICY IF EXISTS payment_transactions_select_profesor ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_select_club ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_select_alumno ON public.payment_transactions;

-- Permite al profesor autenticado ver sus propias transacciones.
CREATE POLICY payment_transactions_select_profesor
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (profesor_id = auth.uid());

-- Permite al club autenticado ver transacciones de clubes que administra.
CREATE POLICY payment_transactions_select_club
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  club_id IN (
    SELECT c.id
    FROM public.clubs c
    WHERE c.user_id = auth.uid()
  )
);

-- Permite al alumno autenticado ver transacciones donde figura como pagador.
CREATE POLICY payment_transactions_select_alumno
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (payer_user_id = auth.uid());

-- Extiende métodos de pago permitidos para incluir pasarela online.
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_method_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_method_check
  CHECK (method IN ('efectivo', 'transferencia_directa', 'pasarela_online'));

-- Agrega configuración de pasarela en el perfil del usuario.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_gateway text CHECK (payment_gateway IN ('mercadopago', 'stripe')),
  ADD COLUMN IF NOT EXISTS payment_gateway_enabled boolean NOT NULL DEFAULT false;

-- Agrega configuración de pasarela a nivel club.
ALTER TABLE public.club_configuracion
  ADD COLUMN IF NOT EXISTS payment_gateway text CHECK (payment_gateway IN ('mercadopago', 'stripe')),
  ADD COLUMN IF NOT EXISTS payment_gateway_enabled boolean NOT NULL DEFAULT false;

-- Crea índices de soporte para consultas frecuentes y filtros por estado.
CREATE INDEX IF NOT EXISTS idx_payment_transactions_profesor_id
  ON public.payment_transactions(profesor_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_club_id
  ON public.payment_transactions(club_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_student_package_id
  ON public.payment_transactions(student_package_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reserva_cancha_id
  ON public.payment_transactions(reserva_cancha_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payer_user_id
  ON public.payment_transactions(payer_user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_status
  ON public.payment_transactions(gateway_status);
