<div align="center">

# TableSync

**Plataforma colaborativa em tempo real para RPG de mesa**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

</div>

## Demo

### Tabuleiro — Durante uma sessão

![Mesa em ação](images/Gameplay%20Master.png)

### Criação de Personagem

![Criação de Personagem Completa](images/Character%20Creation%20Complete.png)

### Painel

![Painel](images/Dashboard%20Forms.png)

### Página de Cadastro

![Cadastro](images/Register.png)

## Funcionalidades

### Para Jogadores
- Crie e personalize um personagem com foto, nome e uma ficha de atributos totalmente dinâmica
- Mova o token do seu personagem na mesa compartilhada em tempo real
- Role dados diretamente no chat usando a notação `/roll NdN+N`
- Edite sua ficha de personagem a qualquer momento

### Para Mestres
- Crie sessões protegidas por senha
- Defina um modelo de ficha personalizado com quaisquer campos (HP, Mana, Força, etc.)
- Crie qualquer ficha de RPG existente, incluindo fichas originais
- Importe modelos de sessões anteriores com um clique
- Posicione tokens de NPCs e inimigos no canvas com nomes, imagens e tamanhos personalizados
- Arraste tokens de NPCs pelo mapa. Os movimentos sincronizam com todos os jogadores instantaneamente
- Atualize a imagem de fundo e sua escala em tempo real
- Edite o modelo durante a sessão. As alterações se propagam instantaneamente para todos os jogadores

### Multijogador em Tempo Real
- Comunicação via WebSocket com protocolo STOMP
- Todas as alterações de estado do mapa (tokens, fundo, NPCs) sincronizam instantaneamente entre todos os clientes conectados
- Novos jogadores aparecem na mesa no momento em que criam seus personagens
- Estado persistente: sessões, posições, fundos e tokens de NPCs sobrevivem a recarregamentos de página

### Segurança
- Autenticação via JWT
- Rate limiting nas rotas `/auth/login` e `/auth/register`
- Todos os endpoints de sessão exigem participação. Você não pode acessar uma sessão à qual não ingressou
- Sessões protegidas por senha (hash bcrypt)

## Stack Tecnológica

### Backend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| Java | 21 | Linguagem |
| Spring Boot | 4.0.2 | Framework |
| PostgreSQL | 16 | Banco de dados |
| Bucket4j | 8.10.1 | Rate limiting |
| OpenAPI | — | Documentação da API |

### Frontend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | 19 | Framework de UI |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | 4 | Estilização |
| Konva | — | Canvas / mesa interativa |
| Lucide React | — | Ícones |

### Infraestrutura
| Tecnologia | Finalidade |
|---|---|
| Docker + Docker Compose | Desenvolvimento local e containerização |

## Arquitetura

```
tablesync/
├── src/                              # Backend Spring Boot
│   └── main/java/com/tablesync/
│       ├── config/                   # Segurança, CORS, WebSocket, filtro JWT, Rate limit
│       ├── controller/               # Controllers REST + WebSocket
│       ├── dto/                      # DTOs de requisição/resposta
│       ├── entity/                   # Entidades JPA
│       ├── enums/                    # Enums (SessionStatus, MessageType, etc.)
│       ├── exception/                # Handler global de exceções
│       ├── repository/               # Repositórios Spring Data JPA
│       └── service/                  # Lógica de negócio
│
├── frontend/                         # React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── Tabletop.tsx          # Canvas com Konva (tokens de jogadores, NPCs, fundo)
│       │   ├── PrivateRoute.tsx
│       │   └── PublicRoute.tsx
│       ├── pages/
│       │   ├── dashboard.tsx         # Gerenciamento de sessões
│       │   ├── SessionEdit.tsx       # Criação de modelos
│       │   ├── SessionCreate.tsx     # Criação de personagem
│       │   ├── SessionPlay.tsx       # Tela principal de jogo
│       │   ├── session.tsx           # Middleware de roteamento
│       │   ├── login.tsx
│       │   └── register.tsx
│       └── services/
│           └── api.ts                # Instância Axios com interceptor JWT
│
├── docker-compose.yml
└── Dockerfile
```

### Tipos de eventos em tempo real (tópicos WebSocket)

| Tipo de evento | Direção | Descrição |
|---|---|---|
| `TOKEN_MOVE` | Qualquer jogador → Todos | Token de personagem arrastado |
| `BACKGROUND_UPDATE` | Mestre → Todos | Imagem ou escala do fundo alterada |
| `CHARACTER_JOINED` | Servidor → Todos | Novo personagem criado, atualizar tokens |
| `CHARACTER_IMAGE_UPDATED` | Jogador → Todos | Avatar do jogador alterado |
| `NPC_TOKEN_ADD` | Mestre → Todos | Token de NPC/inimigo posicionado |
| `NPC_TOKEN_REMOVE` | Mestre → Todos | Token de NPC/inimigo removido |
| `NPC_TOKEN_MOVE` | Mestre → Todos | Token de NPC/inimigo arrastado |
| `NPC_TOKEN_SCALE` | Mestre → Todos | Token de NPC redimensionado |
| `TEMPLATE_UPDATED` | Mestre → Todos | Modelo de ficha editado durante a sessão |

## Como Começar

### Pré-requisitos

- **Java 21+**
- **Maven 3.9+**
- **Node.js 20+**
- **Docker & Docker Compose**

### 1. Clone o repositório

```bash
git clone https://github.com/ArthurDOli/TableSync.git
cd TableSync
```

### 2. Configure as Variáveis de Ambiente

Antes de iniciar qualquer serviço, configure suas variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto.

```bash
touch .env
```

Abra o arquivo `.env` e adicione suas chaves secretas assim (a `ENCRYPTION_AES_KEY` usa um keyset JSON do Google Tink):

```
JWT_SECRET=seu_segredo_hex_256bits_aqui
ENCRYPTION_AES_KEY={"primaryKeyId":1291421818,"key":[{"keyData":{"typeUrl":"type.googleapis.com/google.crypto.tink.AesGcmKey","value":"GiC569bZiyfw/wHM84sAjz+cCTBYvcuQHKqIk930aTq4QQ==","keyMaterialType":"SYMMETRIC"},"status":"ENABLED","keyId":1291421818,"outputPrefixType":"TINK"}]}
```

Você pode gerar chaves aleatórias seguras executando `openssl rand -hex 32` no terminal. Para desenvolvimento local, você pode usar o keyset Tink padrão fornecido acima para a `ENCRYPTION_AES_KEY`.

### 3. Configure o backend

Crie ou edite `src/main/resources/config/application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/tablesync
    username: postgres
    password: postgres

  websocket:
    allowed-origins: http://localhost:5173

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000
```

### 4. Inicie o banco de dados

```bash
docker compose up -d postgres
```

Isso inicia o PostgreSQL na porta `5433` (mapeada para a porta `5432` do container).

### 5. Execute o backend

```bash
export $(grep -v '^#' .env | xargs)

./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

A API estará disponível em `http://localhost:8080`.  
Swagger UI: `http://localhost:8080/swagger-ui.html`

### 6. Execute o frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### 7. (Opcional) Execute tudo com Docker

```bash
docker compose up --build
```

## Documentação da API

Com o backend em execução, acesse o Swagger UI interativo em:

```
http://localhost:8080/swagger-ui.html
```

### Principais endpoints

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | ❌ | Cadastrar novo usuário |
| `POST` | `/api/v1/auth/login` | ❌ | Login e recebimento do JWT |
| `GET` | `/api/v1/sessions/my-sessions` | ✅ | Listar sessões em que o usuário participa |
| `POST` | `/api/v1/sessions` | ✅ | Criar nova sessão |
| `POST` | `/api/v1/sessions/join` | ✅ | Ingressar em uma sessão existente |
| `GET` | `/api/v1/sessions/:id` | ✅ | Obter detalhes da sessão |
| `PATCH` | `/api/v1/sessions/:id/background` | ✅ Mestre | Atualizar imagem de fundo |
| `PATCH` | `/api/v1/sessions/:id/npc-tokens` | ✅ Mestre | Atualizar tokens de NPCs |
| `POST` | `/api/v1/templates` | ✅ Mestre | Criar modelo de personagem |
| `PUT` | `/api/v1/templates/:id` | ✅ Mestre | Atualizar modelo |
| `POST` | `/api/v1/characters` | ✅ | Criar personagem |
| `PATCH` | `/api/v1/characters/:id` | ✅ | Atualizar personagem (ficha, posição, imagem) |
| `GET` | `/api/v1/characters/session/:id` | ✅ | Listar todos os personagens de uma sessão |
| `GET` | `/api/v1/chat/history/:sessionId` | ✅ | Buscar histórico do chat |

## Como Jogar

### Criando uma sessão (Mestre)

1. Cadastre-se ou faça login
2. No Painel, preencha o nome da sessão, descrição e uma senha
3. Clique em Criar — a sessão aparece em "Minhas Sessões"
4. Clique na sua sessão e você será redirecionado ao Painel do Mestre
5. Adicione um nome ao modelo e defina os campos de atributos (ex.: HP, Mana, Força)
6. Clique em Salvar Modelo & Abrir Mesa

### Ingressando em uma sessão (Jogador)

1. Peça ao Mestre o ID e a senha da sessão
2. No Painel, insira o ID e a senha em "Entrar na Sessão"
3. Clique em Entrar e a sessão aparece em "Minhas Sessões"
4. Clique na sessão e você será redirecionado para Forjar seu Herói
5. Preencha o nome do personagem, opcionalmente adicione um avatar e preencha os campos de atributos
6. Clique em Entrar na Mesa

### Durante a sessão

- **Mover seu token:** arraste-o pelo canvas
- **Rolar dados:** digite `/roll 2d20` (ou qualquer fórmula `NdN+N`) no chat
- **Atualizar sua ficha:** edite os campos no painel à esquerda e clique em Salvar
- **Atualizar seu avatar:** passe o mouse sobre seu avatar no painel à esquerda e clique no ícone de câmera

## Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue primeiro para discutir quaisquer mudanças significativas.