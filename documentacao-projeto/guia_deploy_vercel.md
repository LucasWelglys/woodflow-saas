# 🚀 Guia de Deploy Oficial — WoodFlow SaaS

Para colocar o WoodFlow no ar de forma permanente e segura, siga os passos abaixo para conectar seu repositório à Vercel.

## 1. Prepare seu Repositório (GitHub)
- Certifique-se de que todos os arquivos que criamos estão commitados e enviados para o seu repositório no GitHub.

## 2. Conecte à Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New"** > **"Project"**.
3. Importe o repositório `woodflow-saas`.

## 3. Configure as Variáveis de Ambiente
No painel da Vercel, antes de clicar em "Deploy", abra a seção **Environment Variables** e adicione as seguintes chaves (copie do seu `.env.local`):

| Chave | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sua URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua Chave Anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua Service Role Key (opcional, para admin) |

## 4. Deploy Final
- Clique em **"Deploy"**.
- Em menos de 2 minutos, o WoodFlow estará online em `https://woodflow.vercel.app`.

---

> [!TIP]
> **Próxima Etapa:** Após o deploy, vamos configurar o domínio oficial e os alertas do n8n!
