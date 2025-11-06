// Este arquivo (api/submit.js) é o nosso mini-servidor (Proxy) na Vercel
// Esta é a versão ROBUSTA, que checa os erros.

export const config = {
    runtime: 'edge', 
  };
  
  export default async function handler(request) {
    // 1. Pega os dados que o script.js enviou
    const dadosSQL = await request.json();
  
    // 2. Pega as chaves secretas das Variáveis de Ambiente da Vercel
    const TURSO_URL = process.env.TURSO_URL;
    const TURSO_TOKEN = process.env.TURSO_TOKEN;
  
    // --- Verificação de Segurança ---
    if (!TURSO_URL || !TURSO_TOKEN) {
      return new Response(JSON.stringify({ error: "Variáveis de ambiente (chaves) não encontradas." }), { status: 500 });
    }
  
    // 3. Monta o corpo da requisição para o Turso
    const sqlQuery = `
        INSERT INTO respostas (
            nome, email, linguagem_favorita, nivel_atual, 
            desafio_principal, data_limite, interesses, feedback_ebook
        ) 
        VALUES (
            :nome, :email, :linguagem_favorita, :nivel_atual, 
            :desafio_principal, :data_limite, :interesses, :feedback_ebook
        )
    `;
  
    const requestBody = {
        requests: [
            { type: "execute", stmt: { sql: sqlQuery, args: dadosSQL } },
            { type: "close" }
        ]
    };
  
    // 4. Envia a requisição para o Turso (com checagem de erro)
    try {
      const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TURSO_TOKEN}`
          },
          body: JSON.stringify(requestBody)
      });
  
      // --- NOVA CHECAGEM ROBUSTA ---
      // Se a resposta do Turso NÃO for 200 OK (ex: 401, 400)
      if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro do Turso:", errorText);
          // Retorna o erro real do Turso para o usuário
          return new Response(JSON.stringify({ error: `Erro do Turso: ${response.status} ${errorText}` }), { status: 400 });
      }
      
      // Se foi 200 OK, lemos o JSON
      const result = await response.json();
  
      // 5. Retorna a resposta (boa ou ruim) para o script.js
      // Checa se 'results' existe ANTES de ler
      if (result.results && result.results[0] && result.results[0].type === 'ok') {
          // Sucesso! Retorna 201 (Created)
          return new Response(JSON.stringify({ message: "Sucesso!" }), { status: 201 });
      } else {
          // Erro (ex: email duplicado ou resposta malformada)
          const errorMessage = (result.results && result.results[0]) ? result.results[0].error.message : "Resposta inesperada do Turso";
          return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
      }
  
    } catch (error) {
      // Erro de rede (ex: o fetch falhou)
      console.error("Erro no fetch do Proxy:", error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }