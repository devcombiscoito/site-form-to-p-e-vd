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
// 2. FUNÇÃO PRINCIPAL: LIDAR COM O ENVIO (AGORA COM RECAPTCHA)
// ==========================================================
form.addEventListener('submit', function(event) {
    // 1. Sempre previne o envio padrão
    event.preventDefault(); 
    
    // 2. Em vez de enviar, agora nós "executamos" o reCaptcha.
    //    O reCaptcha vai validar o usuário (invisivelmente).
    //    Se for humano, ele vai chamar a função "onRecaptchaSuccess"
    //    que nós definimos no index.html (data-callback).
    console.log("Formulário submetido. Disparando reCaptcha...");
    grecaptcha.execute();
});

// ==========================================================
// 3. FUNÇÃO DE CALLBACK: O RECAPTCHA FOI UM SUCESSO
//    Esta função SÓ é chamada se o Google aprovar o usuário.
// ==========================================================
function onRecaptchaSuccess(token) {
    console.log("reCaptcha validado! Coletando dados...");
    
    // O 'token' é a prova do Google. Não precisamos dele para
    // este método, mas é bom saber que ele existe.

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
    
    // Agora sim, enviamos os dados para o nosso back-end
    enviarDadosParaAPI(dadosParaSQL);
}


// ==========================================================
// 4. FUNÇÃO: Enviar os dados para o PROXY DA VERCEL
//    (Esta função não muda)
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
            // Se o proxy nos retornar um erro (ex: 400 ou 500)
            const errorResult = await response.json();
            // Precisamos resetar o reCaptcha se der erro
            grecaptcha.reset();
            throw new Error(errorResult.error || "Erro desconhecido do servidor");
        }
        
    } catch (error) {
        console.error("Erro ao enviar os dados para o Proxy:", error.message);
        
        // Reseta o reCaptcha para o usuário tentar de novo
        grecaptcha.reset();

        if (error.message && error.message.includes("UNIQUE constraint failed: respostas.email")) {
            alert("Este e-mail já está em nossa base. Verifique sua caixa de entrada!");
        } else {
            alert(`Erro ao conectar ao servidor: ${error.message}.`);
        }
    }
}


// ==========================================================
// 5. FUNÇÃO: Controlar a tela de bônus (COM ADSENSE)
//    (Esta função não muda)
// ==========================================================
function iniciarTelaBonus() {
    form.style.display = 'none';
    telaBonus.style.display = 'block';

    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log("AdSense: Pedido de anúncio enviado.");
    } catch (e) {
        console.error("AdSense: Falha ao carregar o anúncio.", e);
    }

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