// ==========================================================
// 1. REFERÊNCIAS AOS ELEMENTOS HTML
// ==========================================================
const form = document.getElementById('cadastroForm');
const telaBonus = document.getElementById('telaBonus');
const contadorElement = document.getElementById('contador');
const linkEbook = document.getElementById('linkEbook');

// --- CONSTANTES DO TURSO (COM SUAS CHAVES CORRETAS) ---
const TURSO_URL = 'https://formulario-devcombiscoito.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjIzNzc0MzAsImlkIjoiNGFjMGI0YjYtOTEzNS00ZTViLTlmMDgtOTIxM2RiMGY3ZmJhIiwicmlkIjoiMDRmYTJjNTAtODM4Yi00YjQ1LWIxNTgtNDc5ZjdiNmJhZWU5In0.yRnwk9WCnmQhnGIbWRVWBcOOK0OTvQG5txx3S0SVePzCq5WtVdX18H3g38-pXIDpSNpm4tfbAQ9tQ8_DrUDsCw';
// -------------------------------------

const TEMPO_BONUS = 30;

// ==========================================================
// 2. FUNÇÃO PRINCIPAL: Lidar com o envio (ATUALIZADA)
// ==========================================================
form.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const formData = new FormData(form);

    // 1. Coletar dados (incluindo múltiplos checkboxes)
    const dadosFormulario = {};
    formData.forEach((value, key) => {
        if (Object.prototype.hasOwnProperty.call(dadosFormulario, key)) {
            // Se a chave já existe (é um checkbox), transforma em array
            if (Array.isArray(dadosFormulario[key])) {
                dadosFormulario[key].push(value);
            } else {
                dadosFormulario[key] = [dadosFormulario[key], value];
            }
        } else {
            // Se é a primeira vez, apenas atribui
            dadosFormulario[key] = value;
        }
    });

    // 2. Criar o objeto final de 8 colunas (Obrigatório para o Turso)
    //    Garante que todos os parâmetros do SQL existam, mesmo que nulos.
    const dadosParaSQL = {
        nome: dadosFormulario.nome || null,
        email: dadosFormulario.email || null,
        linguagem_favorita: dadosFormulario.linguagem_favorita || null,
        nivel_atual: dadosFormulario.nivel_atual || null,
        desafio_principal: dadosFormulario.desafio_principal || null,
        data_limite: dadosFormulario.data_limite || null, // Se vazio, vira null
        feedback_ebook: dadosFormulario.feedback_ebook || null, // Se vazio, vira null
        
        // Trata o array de interesses (se existir, junta; senão, vira null)
        interesses: Array.isArray(dadosFormulario.interesses) 
                    ? dadosFormulario.interesses.join(', ') 
                    : (dadosFormulario.interesses || null)
    };

    console.log("Dados prontos para envio ao Turso:", dadosParaSQL);
    enviarDadosParaAPI(dadosParaSQL);
});


// ==========================================================
// 3. FUNÇÃO: Enviar os dados para o TURSO (SQL CORRETO)
// ==========================================================
async function enviarDadosParaAPI(dadosSQL) { // Recebe os dados já formatados
    
    // O SQL com os 8 parâmetros nomeados
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
            {
                type: "execute",
                stmt: {
                    sql: sqlQuery,
                    // Enviamos o objeto 'dadosParaSQL' que tem as 8 chaves
                    args: dadosSQL 
                }
            },
            { type: "close" } 
        ]
    };

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

        // Checa se o resultado da primeira (e única) query foi 'ok'
        if (result.results[0].type === 'ok') {
            console.log("Turso: Submissão bem-sucedida!");
            iniciarTelaBonus(); 
            
        } else {
            // Se o Turso retornar um erro (ex: email duplicado)
            throw new Error(result.results[0].error.message);
        }
        
    } catch (error) {
        console.error("Erro ao enviar os dados para o Turso:", error.message);

        // Checagem de e-mail duplicado
        if (error.message && error.message.includes("UNIQUE constraint failed: respostas.email")) {
            alert("Este e-mail já está em nossa base. Verifique sua caixa de entrada!");
        } else {
            alert(`Erro ao conectar ao servidor: ${error.message}.`);
        }
    }
}


// ==========================================================
// 4. FUNÇÃO: Controlar a tela de bônus (Sem alterações)
// ==========================================================
function iniciarTelaBonus() {
    form.style.display = 'none';
    telaBonus.style.display = 'block';
    let tempoRestante = TEMPO_BONUS;
    contadorElement.textContent = tempoRestante;
    
    const intervalo = setInterval(() => {
        tempoRestante--;
        contadorElement.textContent = tempoRestante;

        if (tempoRestante <= 0) {
            clearInterval(intervalo);
            contadorElement.textContent = "LIBERADO!";
            linkEbook.style.display = 'inline-block';
            const h2 = telaBonus.querySelector('h2');
            h2.textContent = "Seu E-Book foi liberado!";
        }
    }, 1000); 
}