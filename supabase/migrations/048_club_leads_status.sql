ALTER TABLE club_leads
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
