-- 002_performance_and_views.sql
-- Melhoria de performance e criação da View Financeira para o Dashboard

-- 1. Criação de Índices BTREE para Isolamento por Tenant (marcenaria_id)
-- Acelera queries filtradas pelo inquilino (tenant principal)
CREATE INDEX IF NOT EXISTS idx_clientes_marcenaria_id ON clientes USING BTREE (marcenaria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_marcenaria_id ON pedidos USING BTREE (marcenaria_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_marcenaria_id ON parcelas USING BTREE (marcenaria_id);
CREATE INDEX IF NOT EXISTS idx_custos_projeto_marcenaria_id ON custos_projeto USING BTREE (marcenaria_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_marcenaria_id ON audit_logs USING BTREE (marcenaria_id);

-- 2. Índices de Performance em Status e Datas de Vencimento
-- Acelera o cálculo de Inadimplência e visualizações por Data (Dashboard)
CREATE INDEX IF NOT EXISTS idx_parcelas_status_vencimento ON parcelas USING BTREE (status, data_vencimento);

-- 3. View Financeira do Dashboard
-- Utilizando security_invoker para garantir que a consulta da View respeite o Row Level Security (RLS) do usuário autenticado no Supabase.
CREATE OR REPLACE VIEW v_dashboard_financeiro WITH (security_invoker = on) AS
SELECT 
    m.id AS marcenaria_id,
    COALESCE((SELECT SUM(valor_total) FROM pedidos p WHERE p.marcenaria_id = m.id), 0) AS faturamento_bruto,
    COALESCE((SELECT SUM(valor) FROM parcelas par WHERE par.marcenaria_id = m.id AND par.status = 'pago'), 0) AS caixa_real,
    COALESCE((SELECT SUM(valor) FROM parcelas par WHERE par.marcenaria_id = m.id AND par.status = 'pendente'), 0) AS a_receber,
    (
        COALESCE((SELECT SUM(valor) FROM parcelas par WHERE par.marcenaria_id = m.id AND par.status = 'pago'), 0) 
        - 
        COALESCE((SELECT SUM(valor) FROM custos_projeto c WHERE c.marcenaria_id = m.id), 0)
    ) AS saldo_projetado
FROM marcenarias m;
