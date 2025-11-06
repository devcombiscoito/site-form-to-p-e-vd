// ==========================================================
// 1. REFERÊNCIAS AOS ELEMENTOS HTML
// ==========================================================
const form = document.getElementById('cadastroForm');
const telaBonus = document.getElementById('telaBonus');
const contadorElement = document.getElementById('contador');
const linkEbook = document.getElementById('linkEbook');

// --- A URL DA API (É O NOSSO PRÓPRIO SITE!) ---
const API_URL = '/api/submit'; 
// -------------------------------------

const TEMPO_BONUS = 30;

// ==========================================================
// 2. FUNÇÃO PRINCIPAL: Lidar com o envio
// ==========================================================
form.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const formData = new FormData(form);

    const dadosFormulario = {};
    formData.forEach((value, key) => {
        if (Object.prototype.hasOwnProperty.call(dadosFormulario, key)) {
            if (Array.isArray(dadosFormulario[key])) {
                dadosFormulario[key].push(value);
            } else {
                dadosFormulario[key] = [dadosFormulario[key], value];
            }
        } else {
            dadosFormulario[key] = value;
        }
    });

    // Cria o objeto final de 8 colunas (Obrigatório para o SQL)
    const dadosParaSQL = {
        nome: dadosFormulario.nome || null,
        email: dadosFormulario.email || null,
        linguagem_favorita: dadosFormulario.linguagem_favorita || null,
        nivel_atual: dadosFormulario.nivel_atual || null,
        desafio_principal: dadosFormulario.desafio_principal || null,
        data_limite: dadosFormulario.data_limite || null,
        feedback_ebook: dadosFormulario.feedback_ebook || null,
        interesses: Array.isArray(dadosFormulario.interesses) 
                    ? dadosFormulario.interesses.join(', ') 
                    : (dadosFormulario.interesses || null)
    };

    console.log("Dados prontos para envio ao Proxy da Vercel:", dadosParaSQL);
    enviarDadosParaAPI(dadosParaSQL);
});


// ==========================================================
// 3. FUNÇÃO: Enviar os dados para o PROXY DA VERCEL
// ==========================================================
async function enviarDadosParaAPI(dadosSQL) { 
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosSQL) 
        });

        if (response.status === 201) {
            console.log("Proxy Vercel: Submissão bem-sucedida!");
            iniciarTelaBonus(); 
            
        } else {
            const errorResult = await response.json();
            throw new Error(errorResult.error || "Erro desconhecido do servidor");
        }
        
    } catch (error) {
        console.error("Erro ao enviar os dados para o Proxy:", error.message);

        if (error.message && error.message.includes("UNIQUE constraint failed: respostas.email")) {
            alert("Este e-mail já está em nossa base. Verifique sua caixa de entrada!");
        } else {
            alert(`Erro ao conectar ao servidor: ${error.message}.`);
        }
    }
}


// ==========================================================
// 4. FUNÇÃO: Controlar a tela de bônus (COM ADSENSE)
// ==========================================================
function iniciarTelaBonus() {
    // 1. Ocultar o formulário
    form.style.display = 'none';
    
    // 2. Mostrar a tela de bônus/ads
    telaBonus.style.display = 'block';

    // 3. --- AQUI ESTÁ O "PUSH" DO ADSENSE ---
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log("AdSense: Pedido de anúncio enviado.");
    } catch (e) {
        console.error("AdSense: Falha ao carregar o anúncio.", e);
    }
    // ------------------------------------------

    // 4. Iniciar o contador (como antes)
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