-- ============================================================================
-- Configuracion > Alertas de Vencimientos: que categorias de documentos de
-- Unidad/Operador generan alerta y con cuantos dias de anticipacion.
-- Se guarda por empresa (multi-tenant) en la columna jsonb alertas_vencimientos.
-- ============================================================================

alter table public.empresas
  add column if not exists alertas_vencimientos jsonb not null default '{
    "unidad": {
      "placas": true,
      "permisos": true,
      "seguroPlacaMexicana": true,
      "seguroPlacaAmericana": true,
      "documentosAdicionales": true,
      "diasNotificar": 30
    },
    "operador": {
      "licencia": true,
      "pasaporte": true,
      "documentosAdicionales": true,
      "diasNotificar": 30
    }
  }'::jsonb;
