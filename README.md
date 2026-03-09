# FinTrackr 💰

O FinTrackr é uma aplicação web de controle financeiro pessoal, projetada para ser rápida, responsiva e funcionar diretamente no navegador como um PWA (Progressive Web App). Com uma interface moderna, gráficos interativos e armazenamento em nuvem, ele ajuda você a gerenciar de perto suas receitas, despesas mensais, cartões de crédito e metas financeiras ("Caixinhas").

## ✨ Funcionalidades Principais

- **Dashboard Interativo:** Visão geral da sua saúde financeira com análise de tendências, distribuição de renda e top despesas, incluindo visão anual detalhada.
- **Gestão Ágil de Lançamentos:** Registro rápido de despesas fixas, variáveis e receitas, além de ferramentas modernas para edições em massa (bulk actions) e categorização automática inteligente.
- **Controle de Cartões de Crédito:** Controle de múltiplas faturas, limites consolidados e projeção de gastos vindouros.
- **Caixinhas e Projetos:** Crie objetivos financeiros customizados, simule taxas de rendimento e acompanhe o progresso até uma data-alvo.
- **Orçamento e Teto de Gastos:** Defina alertas visuais de teto de gastos e orçamento por categorias (metas de consumo).
- **Design Premium:** Suporte nativo e fluido para Dark Mode e Light Mode, todo construído de forma estilosa com Tailwind CSS e CSS Puro (sem frameworks visuais pesados).
- **Trabalho Offline (PWA):** Graças aos Service Workers modernos, instale o app no seu celular ou desktop e não pare de gerenciar as finanças mesmo com baixa internet.

## 🛠️ Tecnologias Utilizadas

- **Frontend Core:** HTML5, Vanilla CSS3 e JavaScript Moderno API
- **Estilização e Responsividade:** Tailwind CSS (via CDN)
- **Backend (Storage & Auth):** Firebase Firestore (NoSQL em tempo real) + Firebase Authentication (Login prático com conta Google)
- **Geração de Gráficos:** SVG nativo dinâmico para renderização ultraleve.

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

O sistema depende de chaves exclusivas de conexão ao seu banco de dados na nuvem para funcionar. Portanto, cadastre-se no [Firebase do Google](https://firebase.google.com/) e crie um novo projeto sem custos para habilitar seus recursos.

### Passo a passo para Inicialização

1. **Clone o repositório em sua máquina:**
   ```bash
   git clone https://github.com/SEU_USUARIO/FinTrackr.git
   cd FinTrackr
   ```

2. **Configuração do Firebase:**
   - No [Console do Firebase](https://console.firebase.google.com/), após criar seu projeto, clique em adicionar um "App Web".
   - Acesse *Authentication*, clique na aba *Sign-in method* e habilite a entrada via **Google**.
   - Acesse o *Firestore Database* e crie um banco de dados em "Modo de Teste" ou configure as Security Rules nativas que permitam as leituras e escritas do Auth.uid correspondente.
   - De volta à pasta do seu projeto local, copie o modelo `firebase-config.example.js` para um novo arquivo real com o nome `firebase-config.js` (O arquivo final é ignorado pelo GIT para sua segurança).
   
   ```bash
   copy firebase-config.example.js firebase-config.js
   ```

   - Abra o `firebase-config.js` em seu editor de código e cole as credenciais do "App Web" geradas pelo Firebase nas propriedades devidas:
   ```javascript
   const firebaseConfig = {
       apiKey: "SUA_API_KEY_AQUI",
       authDomain: "seu-projeto-123.firebaseapp.com",
       projectId: "seu-projeto-123",
       storageBucket: "seu-projeto-123.firebasestorage.app",
       messagingSenderId: "NUMERO_AQUI",
       appId: "APP_ID_AQUI"
   };
   ```

3. **Iniciando um Live Server:**
   Como a arquitetura carrega Service Workers avançados para cache, os arquivos não poderão rodar em aberturas comuns de pastas (file:///...). É necessário instanciar um servidor HTTP de testes local (Ex: Porta 3000 ou 5500).
   - *Via Node.js*: Se tiver instalado basta rodar `npx serve .` no terminal.
   - *Via VSCode*: Instale a extensão "Live Server" > Botão direto no index.html > "Open With Live Server".

4. **Pronto!** A aplicação vai abrir e exibir o Dashboard de tela de Login!

## 🔒 Segurança de Chaves Públicas

Ao subir a sua cópia ou derivado desta base, certifique-se de que o arquivo local `firebase-config.js` jamais seja comitado caso seu repositório seja aberto ao público. Uma diretiva bloqueadora já existe nativamente no `.gitignore` atual para suprimir essa vulnerabilidade.

---
Feito com 💜 para revolucionar planilhas financeiras com as próprias mãos.
