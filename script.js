// ==========================================================
// 1. REFERÊNCIAS AOS ELEMENTOS HTML
// ==========================================================
const form = document.getElementById('cadastroForm');
const telaBonus = document.getElementById('telaBonus');
const contadorElement = document.getElementById('contador');
const linkEbook = document.getElementById('linkEbook');

// URL da sua API de Back-End (Onde o Python/Flask estará rodando)
// 127.0.0.1 é o seu próprio computador.
const API_URL = 'http://127.0.0.1:5000/api/submissao'; 

// Tempo da contagem regressiva em segundos
const TEMPO_BONUS = 30;

// ==========================================================
// 2. FUNÇÃO PRINCIPAL: Lidar com o envio do formulário
// ==========================================================
form.addEventListener('submit', function(event) {
    // Impede o comportamento padrão do HTML (que é recarregar a página)
    event.preventDefault(); 
    
    // 1. Coletar os dados do formulário
    const formData = new FormData(form);
    
    // 2. Converter os dados para um objeto JSON
    const dados = {};
    
    // Este loop robusto garante que todos os campos sejam pegos.
    // E o mais importante: ele agrupa os 'interesses' (checkboxes) em um array.
    formData.forEach((value, key) => {
        // Se a chave já existe (ex: um checkbox), transforma em array
        if (Object.prototype.hasOwnProperty.call(dados, key)) {
            if (Array.isArray(dados[key])) {
                // Se já é um array, adiciona
                dados[key].push(value);
            } else {
                // Se não é um array, transforma em um
                dados[key] = [dados[key], value];
            }
        } else {
            // Se é a primeira vez, apenas atribui
            dados[key] = value;
        }
    });

    console.log("Dados prontos para envio:", dados);

    // 3. Enviar os dados para a API (Back-End)
    enviarDadosParaAPI(dados);
});


// ==========================================================
// 3. FUNÇÃO: Enviar os dados para o Back-End (Python)
// ==========================================================
async function enviarDadosParaAPI(dados) {
    
    // ⚠️ ATENÇÃO: Este bloco 'try/catch' é o código REAL
    // Ele vai falhar (e cair no 'catch') até que seu Back-End (Python) esteja rodando.
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST', // Método de envio
            headers: {
                'Content-Type': 'application/json' // Avisa que estamos enviando JSON
            },
            // Converte o objeto JS para uma string JSON
            body: JSON.stringify(dados) 
        });

        // Se o servidor retornar sucesso (status 201 = Criado)
        if (response.status === 201) { 
            console.log("Submissão bem-sucedida!");
            iniciarTelaBonus(); // Inicia o bônus
            
        } else if (response.status === 409) {
            // 409 = Conflito (Ex: E-mail já existe)
            alert("Este e-mail já está em nossa base. Verifique sua caixa de entrada!");
            
        } else {
            // Lida com outros erros (400, 500, etc.)
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro HTTP! Status: ${response.status}`);
        }
        
    } catch (error) {
        console.error("Erro ao enviar os dados:", error);
        
        // --- SIMULAÇÃO DE SUCESSO PARA TESTE ---
        // Se o Back-end não estiver rodando, o 'fetch' vai falhar.
        // Para testar a tela de bônus, você pode descomentar a linha abaixo
        // e comentar o 'alert'
        
        alert(`Erro ao conectar ao servidor: ${error.message}. (O seu Back-end Python está rodando?)`);
        
        // console.log("MODO DE TESTE: Simulando sucesso.");
        // iniciarTelaBonus(); 
    }
}

// ==========================================================
// 4. FUNÇÃO: Controlar a tela de bônus e a contagem
// ==========================================================
function iniciarTelaBonus() {
    // 1. Ocultar o formulário
    form.style.display = 'none';
    
    // 2. Mostrar a tela de bônus/ads
    telaBonus.style.display = 'block';

    let tempoRestante = TEMPO_BONUS;
    contadorElement.textContent = tempoRestante;
    
    // Iniciar o intervalo de contagem regressiva
    const intervalo = setInterval(() => {
        tempoRestante--;
        contadorElement.textContent = tempoRestante;

        if (tempoRestante <= 0) {
            // Parar o contador
            clearInterval(intervalo);
            
            // Alterar a mensagem e liberar o link
            contadorElement.textContent = "LIBERADO!";
            linkEbook.style.display = 'inline-block'; // Mostra o link
            
            const h2 = telaBonus.querySelector('h2');
            h2.textContent = "Seu E-Book foi liberado!";
        }
    }, 1000); // Roda a cada 1000ms (1 segundo)
}