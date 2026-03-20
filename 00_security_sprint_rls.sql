-- ==============================================================================
-- WOODFLOW SAAS - PHASE 4 SECURITY SPRINT
-- ==============================================================================
-- ATENÇÃO: Execute este script inteiro de uma vez no SQL Editor do Supabase.
-- ==============================================================================

-- 1. Criação da Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marcenaria_id UUID NOT NULL REFERENCES public.marcenarias(id) ON DELETE CASCADE,
    user_id UUID,
    tabela_afetada VARCHAR(100) NOT NULL,
    acao VARCHAR(20) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id UUID NOT NULL,
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Habilitar RLS na tabela de auditoria (SOMENTE LEITURA / INSERT via sistema, sem UPDATE ou DELETE)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marcenaria pode inserir e ler próprios logs de auditoria"
ON public.audit_logs
FOR SELECT
USING (
  marcenaria_id IN (
    SELECT id FROM public.marcenarias WHERE user_id = auth.uid()
  )
);
-- Nota: O INSERT de audit logs normalmente virá do Backend (Server Actions com Service Role).
-- Se a inserção vier com token do User, precisa dessa policy também:
CREATE POLICY "Marcenaria pode inserir logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  marcenaria_id IN (
    SELECT id FROM public.marcenarias WHERE user_id = auth.uid()
  )
);


-- ==============================================================================
-- 2. Habilitando RLS em TODAS as tabelas do Core
-- ==============================================================================
ALTER TABLE public.marcenarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. Criando as Políticas RLS (Block by Default, Allow only matching auth.uid)
-- ==============================================================================

-- 3.1. MARCENARIAS (Tenant Principal)
-- Permite que o auth.uid() leia/atualize apenas a marcenaria da qual é dono
CREATE POLICY "Acesso restrito do usuario a sua marcenaria"
ON public.marcenarias
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- 3.2. CLIENTES
-- Permite operações se a marcenaria_id do cliente pertencer à marcenaria do auth.uid()
CREATE POLICY "Acesso a clientes restrito por tenant"
ON public.clientes
FOR ALL
USING (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
)
WITH CHECK (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
);


-- 3.3. PEDIDOS
CREATE POLICY "Acesso a pedidos restrito por tenant"
ON public.pedidos
FOR ALL
USING (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
)
WITH CHECK (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
);


-- 3.4. PARCELAS
CREATE POLICY "Acesso a parcelas restrito por tenant"
ON public.parcelas
FOR ALL
USING (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
)
WITH CHECK (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
);


-- 3.5. CUSTOS DE PROJETO
CREATE POLICY "Acesso a custos_projeto restrito por tenant"
ON public.custos_projeto
FOR ALL
USING (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
)
WITH CHECK (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
);


-- 3.6. DESPESAS
CREATE POLICY "Acesso a despesas globais restrito por tenant"
ON public.despesas
FOR ALL
USING (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
)
WITH CHECK (
  marcenaria_id IN (SELECT id FROM public.marcenarias WHERE user_id = auth.uid())
);

-- FIM DO SCRIPT DE BLINDAGEM RLS
-- ==============================================================================
