// Este arquivo (api/submit.js) é o nosso mini-servidor (Proxy) na Vercel
// Ele vai receber os dados do script.js e enviá-los ao Turso.

export const config = {
    runtime: 'edge', // Diz para a Vercel rodar isso de forma rápida
  };
  
  export default async function handler(request) {
    // 1. Pega os dados que o script.js enviou
    const dadosSQL = await request.json();
  
    // 2. Pega as chaves secretas das Variáveis de Ambiente da Vercel
    const TURSO_URL = process.env.TURSO_URL;
    const TURSO_TOKEN = process.env.TURSO_TOKEN;
  
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
  
    // 4. Envia a requisição para o Turso (Sem CORS aqui!)
    try {
      const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TURSO_TOKEN}`
          },
          body: JSON.stringify(requestBody)
      });
  
      const result = await response.json();
  
      // 5. Retorna a resposta (boa ou ruim) para o script.js
      if (result.results[0].type === 'ok') {
          // Sucesso! Retorna 201 (Created)
          return new Response(JSON.stringify({ message: "Sucesso!" }), { status: 201 });
      } else {
          // Erro (ex: email duplicado)
          return new Response(JSON.stringify({ error: result.results[0].error.message }), { status: 400 });
      }
  
    } catch (error) {
      // Erro de rede
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }