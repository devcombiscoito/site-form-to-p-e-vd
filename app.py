import sqlite3
import os
from flask import Flask, request, jsonify
from flask_cors import CORS # Essencial para o StackBlitz se conectar ao seu localhost

# --- 1. CONFIGURAÇÃO INICIAL ---

# Define o nome do arquivo do banco de dados
DB_NAME = 'dados.db'

def init_db():
    """
    Função para criar o banco de dados e a tabela 'respostas' 
    se eles ainda não existirem.
    """
    # Verifica se o arquivo DB já existe
    if os.path.exists(DB_NAME):
        print("Banco de dados já existe. Pulando a inicialização.")
        return

    print("Criando novo banco de dados...")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # ⚠️ IMPORTANTE: 
    # Estas colunas DEVEM corresponder aos 'name' do seu HTML
    cursor.execute("""
        CREATE TABLE respostas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            linguagem_favorita TEXT,
            nivel_atual TEXT,
            desafio_principal TEXT,
            data_limite TEXT,
            interesses TEXT,
            feedback_ebook TEXT,
            data_submissao DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    conn.commit()
    conn.close()
    print(f"Banco de dados '{DB_NAME}' e tabela 'respostas' criados com sucesso.")

# --- 2. INICIALIZAÇÃO DO FLASK (API) ---

app = Flask(__name__)
# Permite que o StackBlitz (outro domínio) acesse sua API
CORS(app) 

# --- 3. A ROTA DE SUBMISSÃO (Onde o JS envia os dados) ---

@app.route('/api/submissao', methods=['POST'])
def submissao():
    """
    Recebe os dados do formulário (em JSON) e salva no banco de dados.
    """
    # 1. Receber os dados em formato JSON
    data = request.get_json()
    
    if not data:
        return jsonify({"message": "Dados não fornecidos"}), 400

    # 2. Extrair dados (usando .get() para evitar erros em campos opcionais)
    nome = data.get('nome')
    email = data.get('email')
    
    # Validação Mínima (Back-End SEMPRE deve validar)
    if not nome or not email:
        return jsonify({"message": "Nome e e-mail são obrigatórios"}), 400

    linguagem_favorita = data.get('linguagem_favorita')
    nivel_atual = data.get('nivel_atual')
    desafio_principal = data.get('desafio_principal')
    data_limite = data.get('data_limite')
    feedback_ebook = data.get('feedback_ebook')
    
    # 3. Tratamento especial para Checkboxes (vem como um Array)
    # Vamos juntar o array em uma string separada por vírgulas
    interesses_lista = data.get('interesses', [])
    interesses = ', '.join(interesses_lista)

    # 4. Inserir dados no Banco de Dados
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO respostas (
                nome, email, linguagem_favorita, nivel_atual, 
                desafio_principal, data_limite, interesses, feedback_ebook
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            nome, email, linguagem_favorita, nivel_atual, 
            desafio_principal, data_limite, interesses, feedback_ebook
        ))
        
        conn.commit()
        
    except sqlite3.IntegrityError:
        # Erro comum: Email já existe (definimos UNIQUE no DB)
        conn.close()
        return jsonify({"message": "Este e-mail já foi registrado."}), 409 # 409 = Conflito

    except Exception as e:
        print(f"Erro ao inserir no DB: {e}")
        conn.close()
        return jsonify({"message": "Erro interno do servidor ao salvar dados."}), 500
    
    finally:
        if conn:
            conn.close()
            
    # 5. Retornar sucesso para o Front-End
    # O status 201 (Created) é o status HTTP correto para um POST bem-sucedido
    return jsonify({
        "message": "Dados salvos com sucesso!", 
        "status": "ok"
    }), 201


# --- 4. EXECUÇÃO DO SERVIDOR ---

if __name__ == '__main__':
    init_db() # Garante que o DB e a tabela existam antes de rodar
    # Roda o servidor na porta 5000 (http://127.0.0.1:5000/)
    print("Servidor Flask rodando em http://127.0.0.1:5000/")
    app.run(debug=True, port=5000)