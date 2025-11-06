// Este arquivo (api/submit.js) é o nosso mini-servidor (Proxy) na Vercel
// Esta é a versão FINAL, corrigindo o formato de dados para o Turso.

export const config = {
    runtime: 'edge', 
  };
  
  /**
   * Função auxiliar para formatar os dados para o Turso.
   * Transforma um valor (ex: "Lorenzo") em { "type": "text", "value": "Lorenzo" }
   * Transforma um valor nulo (ex: null) em { "type": "null" }
   */
  function formatarArgsParaTurso(valor) {
    if (valor === null || valor === undefined) {
      return { type: "null" };
    }
    // Garante que o valor seja uma string (Turso é sensível a tipos)
    return { type: "text", value: String(valor) };
  }
  
  export default async function handler(request) {
    // 1. Pega os dados que o script.js enviou
    const dadosSQL = await request.json();
  
    // 2. Pega as chaves secretas das Variáveis de Ambiente da Vercel
    const TURSO_URL = process.env.TURSO_URL;
    const TURSO_TOKEN = process.env.TURSO_TOKEN;
  
    if (!TURSO_URL || !TURSO_TOKEN) {
      return new Response(JSON.stringify({ error: "Variáveis de ambiente (chaves) não encontradas." }), { status: 500 });
    }
  
    // 3. Monta o corpo da requisição para o Turso
    
    const sqlQuery = `
        INSERT INTO respostas (
            nome, email, linguagem_favorita, nivel_atual, 
            desafio_principal, data_limite, interesses, feedback_ebook
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
  
    // --- Criar o array de OBJETOS que o Turso espera ---
    const argsFormatados = [
      formatarArgsParaTurso(dadosSQL.nome),
      formatarArgsParaTurso(dadosSQL.email),
      formatarArgsParaTurso(dadosSQL.linguagem_favorita),
      formatarArgsParaTurso(dadosSQL.nivel_atual),
      formatarArgsParaTurso(dadosSQL.desafio_principal),
      formatarArgsParaTurso(dadosSQL.data_limite),
      formatarArgsParaTurso(dadosSQL.interesses),
      formatarArgsParaTurso(dadosSQL.feedback_ebook)
    ];
  
    const requestBody = {
        requests: [
            { type: "execute", stmt: { sql: sqlQuery, args: argsFormatados } },
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
          
          // --- AQUI ESTÁ O SEU CÓDIGO ---
          // Este log aparecerá nos Logs da VERCEL
          console.log("corretamente executado"); 
          // -----------------------------
          
          // Sucesso! Retorna 201 (Created) para o script.js
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