-- 001_initial_schema.sql
-- Mapeamento inicial do banco de dados WoodFlow SaaS

-- 1. Criação das Tabelas Base

CREATE TABLE IF NOT EXISTS marcenarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marcenaria_id UUID NOT NULL REFERENCES marcenarias(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marcenaria_id UUID NOT NULL REFERENCES marcenarias(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_total NUMERIC NOT NULL,
    status TEXT DEFAULT 'orcamento',
    data_fechamento DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    marcenaria_id UUID NOT NULL REFERENCES marcenarias(id) ON DELETE CASCADE,
    numero_parcela INT NOT NULL,
    valor NUMERIC NOT NULL,
    data_vencimento DATE NOT NULL,
    modalidade TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    meio_recebimento_id UUID,
    num_parcelas_cartao INT,
    se_antecipado BOOLEAN,
    taxa_cartao NUMERIC,
    valor_liquido NUMERIC,
    data_bom_para DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS custos_projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    marcenaria_id UUID NOT NULL REFERENCES marcenarias(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marcenaria_id UUID NOT NULL REFERENCES marcenarias(id) ON DELETE CASCADE,
    tabela TEXT NOT NULL,
    operacao TEXT NOT NULL,
    registro_id UUID,
    detalhes JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitando Row Level Security (RLS)
ALTER TABLE marcenarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Isolamento por Tenant/Marcenaria_id correspondante ao auth.uid())
-- Presumindo que o ID do usuário (auth.uid()) logado bate com o marcenaria_id (ou está mapeado).
-- Ajustar a lógica de auth.uid() de acordo com a regra exata definida no projeto.
CREATE POLICY "Marcenarias isolamento" ON marcenarias FOR ALL USING (id = auth.uid());
CREATE POLICY "Clientes isolamento" ON clientes FOR ALL USING (marcenaria_id = auth.uid());
CREATE POLICY "Pedidos isolamento" ON pedidos FOR ALL USING (marcenaria_id = auth.uid());
CREATE POLICY "Parcelas isolamento" ON parcelas FOR ALL USING (marcenaria_id = auth.uid());
CREATE POLICY "Custos isolamento" ON custos_projeto FOR ALL USING (marcenaria_id = auth.uid());
CREATE POLICY "Audit Logs isolamento" ON audit_logs FOR ALL USING (marcenaria_id = auth.uid());
