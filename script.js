// ==========================================================
// 1. REFERÊNCIAS AOS ELEMENTOS HTML
// ==========================================================
const form = document.getElementById('cadastroForm');
const telaBonus = document.getElementById('telaBonus');
const contadorElement = document.getElementById('contador');
const linkEbook = document.getElementById('linkEbook');

// --- CONSTANTES DO TURSO (COM SUAS NOVAS CHAVES) ---
const TURSO_URL = 'https://formulario-devcombiscoito.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJfV01BaHJxS0VmQ1Q3cGFIZk5OcDVBIn0.4XK-y7zj6YlzY9Pif5JLMxehrzDyz1FQSx_eIC1xQricvZ9NF9WBWLJ8KgBqZhJn2MwTP_0okZEVV5iDLnNVCg';
// -------------------------------------

const TEMPO_BONUS = 30;

// ==========================================================
// 2. FUNÇÃO PRINCIPAL: Lidar com o envio
// ==========================================================
form.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const formData = new FormData(form);
    const dados = {};
    
    formData.forEach((value, key) => {
        if (Object.prototype.hasOwnProperty.call(dados, key)) {
            if (Array.isArray(dados[key])) {
                dados[key].push(value);
            } else {
                dados[key] = [dados[key], value];
            }
        } else {
            dados[key] = value;
        }
    });

    // O Turso/SQLite vai armazenar o array como uma string de texto
    if (Array.isArray(dados.interesses)) {
        dados.interesses = dados.interesses.join(', ');
    }

    // Garante que campos não preenchidos sejam nulos (bom para SQL)
    for (const key in dados) {
        if (dados[key] === "") {
            dados[key] = null;
        }
    }

    console.log("Dados prontos para envio ao Turso:", dados);
    enviarDadosParaAPI(dados);
});


// ==========================================================
// 3. FUNÇÃO: Enviar os dados para o TURSO
// ==========================================================
async function enviarDadosParaAPI(dados) {
    
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
                    args: dados 
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

        if (result.results[0].type === 'ok') {
            console.log("Turso: Submissão bem-sucedida!");
            iniciarTelaBonus(); 
            
        } else {
            throw new Error(result.results[0].error.message);
        }
        
    } catch (error) {
        console.error("Erro ao enviar os dados para o Turso:", error.message);

        if (error.message && error.message.includes("UNIQUE constraint failed: respostas.email")) {
            alert("Este e-mail já está em nossa base. Verifique sua caixa de entrada!");
        } else {
            alert(`Erro ao conectar ao servidor: ${error.message}.`);
        }
    }
}


// ==========================================================
// 4. FUNÇÃO: Controlar a tela de bônus
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