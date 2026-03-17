# WoodFlow SaaS — Roadmap Detalhado

> **Projeto:** WoodFlow SaaS
> **Nicho:** Gestão financeira e operacional para Marcenarias de móveis planejados
> **Objetivo:** Eliminar o caos financeiro do marceneiro, separando Faturamento Bruto (contratos assinados) do Caixa Real (dinheiro recebido), com automação de cobranças via WhatsApp
> **Regra de Execução:** Nenhum código é escrito em uma nova fase sem que todos os testes da fase anterior tenham sido validados pelo Agente e aprovados pelo usuário.

---

## Arquitetura Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR nativo, ótimo para SEO e performance |
| **Estilização** | Tailwind CSS | Produtividade alta, design consistente |
| **Banco de Dados** | Supabase (PostgreSQL) | RLS nativo, Auth integrado, realtime, free tier |
| **ORM** | Prisma | Type-safety, migrations, Supabase-compatible |
| **Autenticação** | Supabase Auth | JWT, OAuth, RLS automático por tenant |
| **Automações** | n8n (self-hosted) | WhatsApp bot, notificações de produção |
| **Deploy** | Vercel (frontend) + VPS (n8n) | CDN global, zero-config Next.js |
| **Cache** | Supabase Edge Functions + Redis | Queries do dashboard (TTL 5min) |

---

## FASE 1 — Infraestrutura e Autenticação

### Objetivo
Criar o esqueleto da aplicação com autenticação segura e isolamento total de dados por marcenaria (multi-tenancy via RLS).

### Escopo

**1.1 Setup do Projeto**
- Inicializar repositório `woodflow-saas` com Next.js 14 e App Router
- Configurar Tailwind CSS com design system WoodFlow (paleta, fontes, tokens)
- Configurar ESLint, Prettier, TypeScript strict mode
- Estrutura de pastas:
  ```
  woodflow-saas/
  ├── app/                    # Next.js App Router
  │   ├── (auth)/             # Grupo de rotas de autenticação (sem layout principal)
  │   │   ├── login/
  │   │   └── cadastro/
  │   ├── (dashboard)/        # Grupo protegido (requer login)
  │   │   ├── layout.tsx      # Layout com sidebar
  │   │   ├── page.tsx        # Dashboard principal
  │   │   ├── pedidos/
  │   │   ├── clientes/
  │   │   └── financeiro/
  │   └── api/                # Route Handlers (backend)
  ├── components/             # Componentes reutilizáveis
  ├── lib/                    # Supabase client, helpers
  ├── hooks/                  # React hooks customizados
  ├── types/                  # TypeScript types globais
  └── documentacao-projeto/   # Este arquivo e demais docs
  ```

**1.2 Supabase — Configuração**
- Criar projeto no Supabase
- Configurar variáveis de ambiente (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Habilitar Auth Email (com confirmação)
- Configurar tabela `marcenarias` (o tenant principal)

**1.3 Autenticação**
- Tela de Cadastro: Nome da marcenaria + email + senha
- Tela de Login: Email + senha com tratamento de erros
- Middleware Next.js: proteger todas as rotas `/dashboard/**`
- Hook `useAuth()`: expor usuário autenticado e marcenaria_id
- Trigger no Supabase: ao criar usuário → criar registro em `marcenarias` automaticamente

**1.4 Row Level Security (RLS)**
- Habilitar RLS em TODAS as tabelas de negócio
- Política padrão: `auth.uid()` deve corresponder ao `user_id` do registro da marcenaria
- Garantir que ZERO dado de outra marcenaria seja retornável via qualquer query

### Protocolo de Testes — Fase 1

| # | Teste | Método | Critério de Aprovação |
|---|---|---|---|
| T1.1 | Build sem erros | `npm run build` | Exit code 0, zero erros TypeScript |
| T1.2 | Cadastro funciona | Criar usuário A e usuário B via tela | Ambos recebem email de confirmação |
| T1.3 | Login e sessão | Login com usuário A | JWT válido armazenado, redirect para `/dashboard` |
| T1.4 | Proteção de rota | Acessar `/dashboard` sem login | Redirect automático para `/login` |
| T1.5 | **Isolamento RLS** | Usuário A tenta acessar dados de B via API | Retorna array vazio ou 403 — NUNCA dados de B |
| T1.6 | Logout | Clicar em Sair | Sessão destruída, cookies limpos, redirect para `/login` |

---

## FASE 2 — Arquitetura de Dados (O Cérebro)

### Objetivo
Criar as tabelas que suportam a lógica central: **Faturamento Bruto** (pedidos fechados) vs. **Faturamento Recebido** (parcelas pagas), com suporte a todas as modalidades de pagamento do marceneiro.

### Escopo

**2.1 Tabelas Core**

```
marcenarias     → o "tenant" (1 por negócio)
  └── clientes  → clientes da marcenaria
  └── pedidos   → contratos fechados (= Faturamento Bruto)
        └── parcelas  → pagamentos individuais (= Faturamento Recebido)
```

**2.2 Lógica de Negócio Central**

| Conceito | Fonte de Dados | Quando Registrar |
|---|---|---|
| **Faturamento Bruto** | `SUM(pedidos.valor_total)` onde `data_fechamento` no mês | Ao assinar o contrato |
| **Faturamento Recebido** | `SUM(parcelas.valor)` onde `data_recebimento` no mês e `status = 'pago'` | Ao confirmar o recebimento |
| **Contas a Receber** | Bruto − Recebido | Calculado dinamicamente |
| **Inadimplência** | Parcelas `status = 'pendente'` com `data_vencimento < hoje` | Calculado dinamicamente |

**2.3 Modalidades de Pagamento Suportadas**
- `dinheiro` — Sem campos extras
- `pix` — Chave PIX (opcional para referência)
- `cheque` — Número, banco, data "bom para"
- `cartao_debito` — Bandeira, taxa da maquininha, valor líquido
- `cartao_credito` — Bandeira, nº parcelas no cartão, taxa, valor líquido
- `boleto` — Nosso número, linha digitável, código de barras, URL, status de vencimento

**2.4 Módulo de Custos do Projeto (Margem de Lucro Real)** ⬅️ *novo*

O marceneiro pode lançar todos os gastos vinculados a um pedido. O sistema calcula automaticamente o **Lucro Real** = Valor Recebido − Custos.

Tabela `custos_projeto`:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `marcenaria_id` | UUID | FK tenant (com RLS) |
| `pedido_id` | UUID | FK para `pedidos` |
| `categoria` | VARCHAR(50) | `material` \| `mao_de_obra` \| `terceirizado` \| `frete` \| `outro` |
| `descricao` | VARCHAR(200) | Ex: "MDF 18mm — 10 chapas", "Marceneiro terceirizado" |
| `valor` | NUMERIC(12,2) | Custo em reais |
| `data_custo` | DATE | Data em que o gasto ocorreu |
| `nota_fiscal` | VARCHAR(100) | Número NF (opcional) |
| `created_at` | TIMESTAMPTZ | — |

Categorias de custo suportadas:
- `material` — MDF, ferragens, vidro, couro, puxadores, parafusos
- `mao_de_obra` — Hora de pintor, vidraceiro, elétrica
- `terceirizado` — Serviço externo (ex: corte CNC)
- `frete` — Entrega ou busca de material
- `outro` — Qualquer gasto avulso

Lógica de Lucro Real por Pedido:
```
Lucro Real = valor_total_pedido − SUM(custos_projeto.valor)
Margem (%) = (Lucro Real / valor_total_pedido) × 100
```

**2.5 Campos Calculados (Views Supabase)**
- `v_dashboard_mensal`: bruto, recebido, a_receber por mês e modalidade
- `v_boletos_vencidos`: boletos pendentes com dias em atraso e dados do cliente
- `v_producao_em_andamento`: pedidos com status `producao` e previsão de entrega
- `v_lucro_real_por_pedido`: valor_pedido, total_custos, lucro_real, margem_percentual ⬅️ *nova*

**2.6 Migrations**
- Migration `001_marcenarias.sql`
- Migration `002_clientes.sql`
- Migration `003_pedidos.sql`
- Migration `004_parcelas.sql`
- Migration `005_custos_projeto.sql` ⬅️ *nova*
- Migration `006_views_financeiras.sql`
- Migration `007_rls_policies.sql`
- Migration `008_triggers_e_funcoes.sql`

### Protocolo de Testes — Fase 2

| # | Teste | Método | Critério de Aprovação |
|---|---|---|---|
| T2.1 | Migrations aplicadas | `npx prisma migrate deploy` | Zero erros, tabelas criadas |
| T2.2 | Criar pedido com 3 parcelas | SQL direto + API | Registros criados com FK corretas |
| T2.3 | **Bruto ≠ Recebido** | Pedido R$12k com 1 parcela paga de R$4k | Bruto=12k, Recebido=4k, A\_receber=8k |
| T2.4 | Boleto vencido aparece | Criar parcela com `data_vencimento` passada | Aparece em `v_boletos_vencidos` |
| T2.5 | RLS nas parcelas | Usuário B não pode ver parcelas de A | Query retorna vazio |
| T2.6 | Cheque com "bom para" | Criar parcela cheque com data futura | Campo `data_bom_para` salvo corretamente |
| T2.7 | Cartão com taxa | Criar parcela cartão 1.99% sobre R$1000 | `valor_liquido = 980.10` |
| T2.8 | **Custo lançado** | Lançar R$3.200 em materiais para pedido R$12k | Custo salvo com FK correta |
| T2.9 | **Lucro Real calculado** | Pedido R$12k com R$4k em custos | `v_lucro_real_por_pedido`: lucro=8k, margem=66.7% |
| T2.10 | RLS em custos | Usuário B não pode ver custos de A | Query retorna vazio |

---

## FASE 3 — Frontend & Design (WoodFlow UI)

### Objetivo
Construir a interface focada em clareza financeira: o marceneiro precisa entender sua situação em menos de 5 segundos ao abrir o app.

### Escopo

**3.1 Design System WoodFlow**
- **Paleta:** Tons de madeira escura (primária) + verde caixa (positivo) + âmbar/laranja (alerta) + vermelho (vencido)
- **Tipografia:** Inter (sans-serif, clareza numérica)
- **Componentes base:** Button, Input, Card, Badge, Modal, Table, Skeleton

**3.2 Telas do MVP**

| Tela | Rota | Prioridade |
|---|---|---|
| Dashboard Financeiro | `/dashboard` | **Crítica** |
| Lista de Pedidos | `/dashboard/pedidos` | **Crítica** |
| Novo Pedido | `/dashboard/pedidos/novo` | **Crítica** |
| Detalhe do Pedido | `/dashboard/pedidos/[id]` | **Crítica** |
| Confirmar Recebimento | Modal no detalhe | **Crítica** |
| Lista de Clientes | `/dashboard/clientes` | Alta |
| Novo Cliente | Modal/página | Alta |
| Boletos Vencidos | `/dashboard/financeiro/vencidos` | Alta |
| Relatório Mensal | `/dashboard/financeiro/mensal` | Média |
| Configurações | `/dashboard/configuracoes` | Baixa |

**3.3 Dashboard — Anatomia dos Cards**
```
┌─────────────────────────────────────────────────────────┐
│  🏠 WoodFlow           Olá, Marcos · Março 2026    [↓]  │
├──────────────┬──────────────┬──────────────┬────────────┤
│ 💰 FAT.BRUTO │ ✅ RECEBIDO  │ ⏳ A RECEBER │ ⚠️ VENCIDO │
│  R$ 43.700   │  R$ 29.200  │  R$ 14.500   │  R$ 5.200  │
│  3 contratos │  caixa real │  em aberto   │  2 boletos │
├──────────────┴─────────────┴──────────────┴────────────┤
│  RECEBIDO POR MODALIDADE                                │
│  💵 Dinheiro/PIX   R$18.400  ████████░░ 63%            │
│  🏦 Boleto          R$ 7.500  ████░░░░░░ 26%            │
│  💳 Cartão          R$ 3.300  ██░░░░░░░░ 11%            │
├─────────────────────────────────────────────────────────┤
│  PRÓXIMOS VENCIMENTOS (7 dias)                          │
│  #034 - Cozinha Fernanda  Boleto  R$3.200  vence 18/03  │
│  #031 - Quarto Thomaz     Cheque  R$1.800  vence 20/03  │
└─────────────────────────────────────────────────────────┘
```

**3.4 Fluxo de Cadastro de Pedido (crítico)**
1. Selecionar/criar cliente
2. Descrição do móvel + valor total
3. Definir parcelamento (adicionar N parcelas dinamicamente)
4. Para cada parcela: modalidade → campos específicos → data de vencimento
5. Confirmação: mostrar resumo (total parcelas = valor do pedido)

**3.5 Componentes de Gráfico**
- Recharts (leve, server-compatible com Next.js)
- Gráfico de barras: Recebido por mês (últimos 6 meses)
- Gráfico de rosca: Distribuição por modalidade de pagamento

### Protocolo de Testes — Fase 3

| # | Teste | Método | Critério de Aprovação |
|---|---|---|---|
| T3.1 | Build sem erros | `npm run build` | Zero erros, zero warnings TypeScript |
| T3.2 | LCP do Dashboard | Lighthouse (modo produção) | LCP ≤ 2.5s |
| T3.3 | Responsividade | Viewport 375px (iPhone SE) | Sem overflow horizontal, cards legíveis |
| T3.4 | Cards do dashboard | Cadastrar pedido + confirmar parcela | Cards atualizam valores corretamente |
| T3.5 | Barras de modalidade | Pagar em 2 modalidades diferentes | Percentuais somam 100%, barras corretas |
| T3.6 | Formulário de pedido | Adicionar 3 parcelas com modalidades mistas | Soma das parcelas = valor total do pedido |
| T3.7 | Acessibilidade | axe DevTools ou Lighthouse | Zero erros críticos de acessibilidade |
| T3.8 | Loading states | Simular rede lenta (DevTools 3G) | Skeletons aparecem, sem layout shift |

---

## FASE 4 — Segurança & Auditoria

### Objetivo
Blindar a aplicação contra as vulnerabilidades mais comuns (OWASP Top 10), implementar logs de auditoria para transações financeiras e configurar os headers de segurança obrigatórios.

### Escopo

**4.1 Validação de Input (Server-side)**
- Biblioteca Zod em todos os Route Handlers e Server Actions
- Nenhum dado de formulário chega ao banco sem passar por schema de validação
- Schemas para: `ClienteSchema`, `PedidoSchema`, `ParcelaSchema`, `ConfirmarRecebimentoSchema`

**4.2 Proteção contra Injection**
- Uso exclusivo de Prisma (queries parametrizadas) — zero SQL concatenado como string
- Escape de dados em templates de WhatsApp
- Sanitização de nomes de arquivo (caso futura função de upload de comprovante)

**4.3 Headers de Segurança (Next.js `next.config.js`)**
```
Content-Security-Policy (CSP)
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security (HSTS)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**4.4 Rate Limiting**
- Middleware de rate limit nas rotas de auth: máximo 5 tentativas de login em 15 minutos
- Rate limit global para APIs de escrita: 30 req/min por IP

**4.5 Log de Auditoria Financeira**
- Tabela `audit_logs` registra obrigatoriamente:
  - Criação/edição/cancelamento de pedidos
  - Confirmação de recebimento de parcela
  - Alteração de valor de parcela
  - Cancelamento de pedido
- Campos: `marcenaria_id`, `user_id`, `acao`, `entidade`, `valores_anteriores` (JSONB), `valores_novos` (JSONB), `ip`, `created_at`

**4.6 Proteção de Variáveis**
- Auditoria de `.env` — nenhuma chave secreta em código ou commits
- `SUPABASE_SERVICE_ROLE_KEY` nunca exposta ao cliente (somente em Server Actions)
- Checklist de segurança pré-deploy

### Protocolo de Testes — Fase 4

| # | Teste | Método | Critério de Aprovação |
|---|---|---|---|
| T4.1 | Headers de segurança | [securityheaders.com](https://securityheaders.com) no staging | Nota A ou A+ |
| T4.2 | Injeção SQL | Enviar `'; DROP TABLE pedidos; --` em campo texto | Zod rejeita ou Prisma parametriza — banco intacto |
| T4.3 | XSS | Enviar `<script>alert(1)</script>` em nome do cliente | Caractere escapado, sem execução de script |
| T4.4 | Rate limit login | 6 tentativas de login incorretas seguidas | 6ª tentativa retorna 429 |
| T4.5 | Audit log | Confirmar recebimento de parcela | Registro criado em `audit_logs` com valores antigos e novos |
| T4.6 | Variáveis expostas | `npm run build` + inspecionar bundle JS | Nenhuma chave `SERVICE_ROLE` ou segredo no bundle |
| T4.7 | HTTPS forçado | Acessar via HTTP em staging | Redirect 301 para HTTPS |

---

## FASE 5 — Ecossistema de Automação (n8n + WhatsApp)

### Objetivo
Implantar o sistema de automações que é o **principal diferencial competitivo do WoodFlow**: cobrança automática de boletos vencidos e notificações de status de produção via WhatsApp.

### Escopo

**5.1 Infraestrutura n8n**
- Deploy do n8n em VPS (self-hosted via Docker Compose)
- Configuração de HTTPS no subdomínio `automacoes.woodflow.app`
- Credenciais salvas no n8n: Supabase API Key, WhatsApp Meta API Token
- Webhook endpoint da API WoodFlow configurado como trigger

**5.2 Template de Mensagens WhatsApp (Meta Business)**
- `boleto_vencido_d1` — Lembrete suave (1 dia após vencimento)
- `boleto_vencido_d3` — Tom mais firme (3 dias)
- `boleto_vencido_d7` — Urgência (7 dias)
- `producao_iniciada` — Móvel entrou na produção
- `pronto_para_entrega` — Móvel finalizado + botões interativos (Confirmar / Problema / Reagendar)
- `lembrete_vencimento` — Aviso D-2 antes do vencimento

**5.3 Workflows n8n Planejados**

| Workflow | Trigger | Ação |
|---|---|---|
| **Cobrança Boleto Vencido** | Schedule (diário 9h) | Busca boletos vencidos D+1/D+3/D+7 → envia WhatsApp |
| **Lembrete Pré-Vencimento** | Schedule (diário 8h) | Busca parcelas vencendo em 2 dias → aviso WhatsApp |
| **Notificação Produção** | Webhook (status muda) | Envia WhatsApp "seu móvel entrou em produção" |
| **Notificação Pronto** | Webhook (status muda) | Envia WhatsApp com botões interativos de confirmação |
| **Registro de Resposta** | Webhook WhatsApp | Captura respostas dos botões → atualiza pedido no banco |

**5.4 Endpoint API WoodFlow → n8n**
- `POST /api/webhooks/status-pedido` — Dispara ao mudar status do pedido
- `POST /api/webhooks/parcela-paga` — Confirma pagamento recebido
- Ambos com autenticação por `X-WoodFlow-Secret` header

**5.5 Configuração por Marcenaria**
- Tela de Configurações: ativar/desativar cada tipo de automação
- Campo: número WhatsApp Business da marcenaria
- Campo: horário preferido para envio de cobranças

### Protocolo de Testes — Fase 5

| # | Teste | Método | Critério de Aprovação |
|---|---|---|---|
| T5.1 | n8n online | Acessar `automacoes.woodflow.app` | Login OK, workflows visíveis |
| T5.2 | Template aprovado | Verificar no Meta Business | Status "Aprovado" para todos os templates |
| T5.3 | Webhook status | Mudar pedido para `producao` | Workflow n8n disparado, log registrado |
| T5.4 | Boleto vencido detectado | Criar parcela vencida ontem | Query retorna parcela, mensagem enviada ao número de teste |
| T5.5 | Não duplicar envio | Executar workflow 2x para mesmo boleto | Segunda execução não envia (idempotência via log) |
| T5.6 | Resposta de botão | Clicar "✅ Recebi" no WhatsApp de teste | Pedido atualizado para `entregue` no banco |
| T5.7 | Opt-out respeitado | Marcenaria desativa cobrança WA | Workflow pula clientes dessa marcenaria |

---

## FASE 6 — Deploy & Escala

### Objetivo
Colocar o WoodFlow em produção com performance, monitoramento e a capacidade de crescer de 10 para 1.000 clientes sem refatoração.

### Escopo

**6.1 Deploy Frontend — Vercel**
- Projeto criado na Vercel conectado ao repositório GitHub
- Branch `main` → produção (`woodflow.app`)
- Branch `develop` → staging (`staging.woodflow.app`)
- Variáveis de ambiente configuradas no dashboard Vercel
- Preview deploys automáticos para cada Pull Request

**6.2 Performance**
- Dashboard carregado com `React.Suspense` + Skeleton
- Queries do dashboard com cache de 5 minutos (`next: { revalidate: 300 }`)
- Imagens otimizadas com `next/image`
- Fontes otimizadas com `next/font` (sem FOIT)
- Bundle analysis: `@next/bundle-analyzer` para identificar bloat

**6.3 Monitoramento e Observabilidade**
- Vercel Analytics (Core Web Vitals em produção)
- Sentry (erros de frontend e backend / Server Actions)
- Supabase Dashboard (uso de banco, queries lentas)
- Alertas: Sentry notifica via email se error rate > 1%

**6.4 Banco de Dados — Escalabilidade**
- Supabase Connection Pooling (PgBouncer) habilitado
- Índices revisados com `EXPLAIN ANALYZE` nas queries do dashboard
- `pg_cron` para manutenção: limpeza de `audit_logs` > 1 ano

**6.5 CI/CD Pipeline (GitHub Actions)**
```
Push para develop →
  ├── Lint (ESLint + TypeScript Check)
  ├── Testes automatizados
  ├── Build de verificação
  └── Deploy automático em staging

Merge para main →
  ├── Todos os checks acima
  ├── Prisma migrate deploy (produção)
  └── Deploy em produção (Vercel)
```

**6.6 Backup e Resiliência do n8n (Automações)** ⬅️ *novo*

As automações de cobrança são missão crítica — um n8n fora do ar significa boletos não cobrados e clientes sem aviso de produção. Protocolo de proteção:

| Camada | Estratégia | Frequência |
|---|---|---|
| **Workflows** | Export automático dos workflows em JSON para repositório Git privado | Diário (cron 2h) |
| **Credenciais** | Backup das credenciais encriptadas do n8n (arquivo `credentials.json`) para S3/Backblaze B2 | Diário |
| **Banco do n8n** | Dump do PostgreSQL do n8n para bucket externo | Diário |
| **Volume Docker** | Snapshot do volume `n8n_data` | Semanal |
| **Restore drill** | Simulação de restore completo em ambiente de teste | Mensal |

Estrutura de backup no repositório Git:
```
woodflow-saas/
└── n8n-backups/
    ├── workflows/
    │   ├── cobranca_boleto_vencido.json
    │   ├── lembrete_pre_vencimento.json
    │   ├── notificacao_producao.json
    │   ├── notificacao_pronto.json
    │   └── registro_resposta_wa.json
    └── README.md  ← instruções de restore
```

Script de export automático (n8n CLI via cron):
```bash
# Roda no VPS do n8n — 02:00 todo dia
n8n export:workflow --backup --output=/backups/workflows/
git -C /backups add . && git commit -m "backup $(date +%Y-%m-%d)"
git -C /backups push origin main
```

Monitoramento de uptime do n8n:
- Configurar [UptimeRobot](https://uptimerobot.com) no endpoint `https://automacoes.woodflow.app/healthz`
- Alerta via email + WhatsApp se n8n ficar offline por > 5 minutos
- Restart automático: `restart: always` no `docker-compose.yml` (já configurado na Fase 5)

**6.7 Checklist Pré-Launch**
- [ ] HTTPS ativo e HSTS configurado
- [ ] `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] Lighthouse score ≥ 90 em Performance, Acessibilidade e SEO
- [ ] Backup automático do Supabase habilitado (diário)
- [ ] **Backup dos workflows n8n configurado e testado** ⬅️ *novo*
- [ ] **UptimeRobot monitorando n8n com alerta ativo** ⬅️ *novo*
- [ ] Política de privacidade e Termos de Uso publicados
- [ ] Google Search Console configurado
- [ ] Domínio personalizado `woodflow.app` configurado

### Protocolo de Testes — Fase 6

| # | Teste | Método | Critério de Aprovação |
|---|---|---|---|
| T6.1 | Build de produção | `npm run build` no ambiente de produção | Exit 0, zero erros |
| T6.2 | Lighthouse produção | Lighthouse no domínio final | Performance ≥ 90, Acessibilidade ≥ 90 |
| T6.3 | LCP real | WebPageTest.org (3G Fast) | LCP ≤ 2.5s |
| T6.4 | Load test básico | 50 usuários simultâneos (k6 ou Artillery) | Sem erros 5xx, P95 latência ≤ 500ms |
| T6.5 | CI/CD funciona | Push para `develop` | Pipeline executa e deploy staging OK |
| T6.6 | Rollback | Reverter último deploy na Vercel | Sistema volta à versão anterior em < 1 min |
| T6.7 | Headers prod | securityheaders.com no domínio final | Nota A+ |
| T6.8 | **Backup n8n** | Executar script de backup manualmente | Arquivos JSON gerados e commitados no Git |
| T6.9 | **Restore n8n** | Apagar workflows e restaurar do backup | Todos os 5 workflows recuperados sem perda |

---

## Resumo de Fases e Estimativas

| Fase | Nome | Duração Estimada | Dependência |
|---|---|---|---|
| **1** | Infraestrutura & Auth | 1 semana | — |
| **2** | Arquitetura de Dados | 1 semana | Fase 1 concluída |
| **3** | Frontend & Design | 2 semanas | Fase 2 concluída |
| **4** | Segurança & Auditoria | 3 dias | Fase 3 concluída |
| **5** | Automações n8n/WhatsApp | 1 semana | Fase 2 concluída |
| **6** | Deploy & Escala | 3 dias | Fases 4 e 5 concluídas |
| **🚀** | **Launch MVP** | **~7 semanas total** | — |

---

## Protocolo Geral de Autorização

> **Regra de ouro:** O Agente NUNCA avança para a próxima fase sem:
> 1. Completar 100% dos testes da fase atual
> 2. Reportar os resultados ao usuário com evidências
> 3. Receber aprovação explícita para prosseguir

---

*WoodFlow SaaS · Roadmap v1.1 · 16/03/2026*
*v1.1: Adicionado módulo de Custos/Margem (Fase 2) e protocolo de Backup n8n (Fase 6)*
*Documento gerado pelo Agente Antigravity com skills: Planejamento + Arquitetura de Dados + Segurança + n8n/WhatsApp*
