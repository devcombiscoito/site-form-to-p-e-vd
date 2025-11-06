// Este arquivo (api/submit.js) é o nosso mini-servidor (Proxy) na Vercel
// Esta é a versão FINAL, corrigindo o erro "map vs sequence"

export const config = {
    runtime: 'edge', 
  };
  
  export default async function handler(request) {
    // 1. Pega os dados que o script.js enviou (como um objeto/map)
    const dadosSQL = await request.json();
  
    // 2. Pega as chaves secretas das Variáveis de Ambiente da Vercel
    const TURSO_URL = process.env.TURSO_URL;
    const TURSO_TOKEN = process.env.TURSO_TOKEN;
  
    if (!TURSO_URL || !TURSO_TOKEN) {
      return new Response(JSON.stringify({ error: "Variáveis de ambiente (chaves) não encontradas." }), { status: 500 });
    }
  
    // 3. Monta o corpo da requisição para o Turso
    
    // --- MUDANÇA 1: Usar (?) em vez de (:nome) ---
    const sqlQuery = `
        INSERT INTO respostas (
            nome, email, linguagem_favorita, nivel_atual, 
            desafio_principal, data_limite, interesses, feedback_ebook
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
  
    // --- MUDANÇA 2: Converter o objeto (map) em um array (sequence) ---
    // A ordem DEVE ser a mesma do INSERT acima.
    const argsArray = [
      dadosSQL.nome,
      dadosSQL.email,
      dadosSQL.linguagem_favorita,
      dadosSQL.nivel_atual,
      dadosSQL.desafio_principal,
      dadosSQL.data_limite,
      dadosSQL.interesses,
      dadosSQL.feedback_ebook
    ];
  
    const requestBody = {
        requests: [
            // --- MUDANÇA 3: Enviar o array (argsArray) ---
            { type: "execute", stmt: { sql: sqlQuery, args: argsArray } },
            { type: "close" }
        ]
    };
  
    // 4. Envia a requisição para o Turso
    try {
      const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${TURSO_TOKEN}`
          },
          body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro do Turso:", errorText);
          return new Response(JSON.stringify({ error: `Erro do Turso: ${response.status} ${errorText}` }), { status: 400 });
      }
      
      const result = await response.json();
  
      // 5. Retorna a resposta (boa ou ruim) para o script.js
      if (result.results && result.results[0] && result.results[0].type === 'ok') {
          // Sucesso!
          return new Response(JSON.stringify({ message: "Sucesso!" }), { status: 201 });
      } else {
          // Erro (ex: email duplicado)
          const errorMessage = (result.results && result.results[0]) ? result.results[0].error.message : "Resposta inesperada do Turso";
          return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
      }
  
    } catch (error) {
      console.error("Erro no fetch do Proxy:", error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }