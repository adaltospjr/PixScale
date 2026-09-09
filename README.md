# ⚡ PixScale — Distributed Core Banking Platform

> **Projeto de estudo e case de engenharia de software**

O **PixScale** é um projeto desenvolvido com o objetivo de estudar e demonstrar, na prática, conceitos de **Backend, Microsserviços, Sistemas Distribuídos, Mensageria e Engenharia de Software** aplicados a um cenário financeiro.

O projeto simula um fluxo de processamento de transações Pix utilizando uma arquitetura distribuída baseada em **Clean Architecture** e **Event-Driven Architecture**, explorando conceitos como idempotência, controle de concorrência, resiliência, segurança, processamento assíncrono e consistência transacional.

> **Importante:** o PixScale é um projeto de estudo e demonstração técnica. Não se trata de uma plataforma bancária real ou de um sistema destinado a produção.

---

## 🏛️ Arquitetura

![PixScale Architecture](architecture.png)

O PixScale utiliza uma arquitetura híbrida, combinando processamento **síncrono** para validações e proteção da entrada com processamento **assíncrono** para o fluxo transacional.

### Fluxo principal

```text
Cliente
   │
   │ HTTP + JWT
   ▼
pixscale-gateway
   │
   │ HTTP síncrono
   ▼
api-registration-limits
   │
   │ Evento de pagamento
   ▼
Apache Kafka
   │
   │ Consumo assíncrono
   ▼
pixscale-worker
   │
   │ Transação ACID
   ▼
PostgreSQL
```

---

## 🧩 Serviços

### `pixscale-gateway`

Responsável pela entrada síncrona das transações.

- Autenticação via JWT.
- Controle de idempotência na entrada.
- Persistência da chave de idempotência e hash do payload.
- Circuit Breaker nas chamadas para serviços dependentes.
- Despacho de eventos para o Apache Kafka.
- Logs estruturados para observabilidade.

### `api-registration-limits`

Responsável pela validação das regras de limite da transação.

- Avaliação das regras de negócio.
- Consulta ao PostgreSQL para cálculo do valor acumulado no dia.
- Utilização de `SUM` e `FILTER` para cálculo dos gastos.
- Health checks das dependências de infraestrutura.

### `pixscale-worker`

Responsável pelo processamento transacional assíncrono.

- Consumo de eventos do Apache Kafka.
- Controle de idempotência.
- Débito e crédito dentro de uma transação ACID.
- Controle de concorrência utilizando PostgreSQL.
- Proteção contra processamento duplicado de eventos.

---

## 🚀 Conceitos de Engenharia

### 1. Arquitetura Distribuída

O projeto foi estruturado para separar responsabilidades entre diferentes serviços, permitindo estudar os desafios existentes em sistemas distribuídos.

A comunicação entre os componentes combina:

- HTTP para operações síncronas;
- Apache Kafka para comunicação assíncrona;
- PostgreSQL para persistência e consistência transacional.

### 2. Event-Driven Architecture

Após as validações síncronas, uma transação válida é publicada no Kafka.

```text
Request
   ↓
Validações
   ↓
Kafka
   ↓
Worker
   ↓
Processamento transacional
```

Essa abordagem permite estudar desacoplamento, processamento assíncrono, mensageria, consumidores, reprocessamento e idempotência.

### 3. Circuit Breaker

As chamadas HTTP entre o Gateway e a API de Limites utilizam um **Circuit Breaker** com três estados:

- `CLOSED`
- `OPEN`
- `HALF_OPEN`

O mecanismo possui cooldown configurável e tem como objetivo evitar que uma indisponibilidade de um serviço dependente provoque efeito cascata no restante do sistema.

### 4. Health Checks

Os serviços possuem endpoints para verificação de saúde e prontidão:

```text
/health/live
/health/ready
```

O conceito de readiness permite diferenciar um processo que está ativo de um serviço que está efetivamente pronto para receber requisições.

---

## 🔄 Idempotência e Controle de Concorrência

Um dos principais objetivos do projeto é estudar como evitar o processamento duplicado de uma mesma transação em um ambiente distribuído.

Para isso, o **PostgreSQL participa diretamente da estratégia de idempotência**, utilizando restrições de unicidade e operações atômicas.

### Restrição única

O `pixscale-worker` utiliza uma chave única para impedir que o mesmo evento seja processado mais de uma vez.

### `ON CONFLICT DO NOTHING`

Durante o processamento:

```sql
INSERT ... ON CONFLICT DO NOTHING
```

Quando a chave já existe, o PostgreSQL não cria uma nova linha.

A aplicação identifica esse cenário através do resultado da operação:

```text
rowCount === 0
```

Dessa forma, o processamento duplicado é interrompido antes que uma nova movimentação financeira seja executada.

---

## 💳 Consistência Transacional

As operações financeiras são executadas utilizando transações ACID no PostgreSQL.

```sql
BEGIN

-- validações
-- débito
-- crédito
-- atualização de estado

COMMIT
```

Em caso de falha:

```sql
ROLLBACK
```

Isso permite estudar como garantir atomicidade entre diferentes operações que fazem parte de uma mesma transação.

As queries utilizam parâmetros (`$1`, `$2`, etc.), evitando concatenação direta de valores e reduzindo a superfície para SQL Injection.

---

## 🔐 Segurança

A autenticação é implementada através de um `JwtGuard` utilizando recursos nativos do Node.js.

A validação do token utiliza:

- JWT;
- HMAC-SHA256 (HS256);
- validação das claims `sub`, `exp`, `iss` e `aud`;
- `timingSafeEqual` para comparação da assinatura.

A implementação foi utilizada como oportunidade de estudo sobre autenticação, criptografia e cuidados básicos relacionados à validação de tokens.

---

## 📊 Observabilidade

O projeto utiliza um `StructuredLogger` para gerar logs estruturados em JSON enviados para `stdout`.

Exemplo conceitual:

```json
{
  "event": "payment.request.received",
  "account": "123456"
}
```

O formato estruturado facilita:

- parsing automatizado;
- agregação de logs;
- busca e indexação;
- correlação de eventos;
- integração com ferramentas de observabilidade.

O projeto **não possui um sistema dedicado de auditoria ou trilha de auditoria persistente**. Os logs existentes têm foco em observabilidade e diagnóstico da aplicação.

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | NestJS |
| Linguagem | TypeScript |
| Mensageria | Apache Kafka |
| Broker | Kafka KRaft Single-Broker |
| Banco de Dados | PostgreSQL |
| Autenticação | JWT / HS256 |
| Criptografia | `node:crypto` |
| Arquitetura | Clean Architecture + Event-Driven Architecture |
| Infraestrutura local | Docker / Docker Compose |

---

## 📂 Estrutura do Projeto

```text
PixScale/
├── pixscale-gateway/
│   ├── src/
│   └── ...
│
├── api-registration-limits/
│   ├── src/
│   └── ...
│
├── pixscale-worker/
│   ├── src/
│   └── ...
│
├── pix-scale/
│   └── infra/
│       └── database/
│
├── docker-compose.yml
├── architecture.png
├── .env.example
├── package.json
└── README.md
```

O monorepo separa as responsabilidades de entrada, validação de regras de negócio e processamento transacional assíncrono.

---

## ▶️ Como executar

### Pré-requisitos

- Node.js
- Docker
- Docker Compose
- Git

### Subindo o projeto

Clone o repositório:

```bash
git clone https://github.com/adaltospjr/PixScale.git
cd PixScale
```

Inicialize os serviços:

```bash
docker compose up --build
```

Após a inicialização, os serviços estarão disponíveis conforme as portas configuradas no `docker-compose.yml`.

### Desenvolvimento local

Para executar um serviço individualmente:

```bash
npm install
npm run start:dev
```

Consulte os respectivos `package.json` para verificar os scripts disponíveis em cada aplicação.

---

## 🔄 Modelo de Processamento

O fluxo simplificado de uma transação é:

```text
1. Cliente envia a requisição
        ↓
2. Gateway valida o JWT
        ↓
3. Idempotency-Key e payload são verificados
        ↓
4. Circuit Breaker protege as dependências
        ↓
5. API de Limites avalia as regras
        ↓
6. Evento válido é publicado no Kafka
        ↓
7. Worker consome o evento
        ↓
8. Idempotência é validada no PostgreSQL
        ↓
9. Transação financeira é executada
        ↓
10. PostgreSQL garante atomicidade
```

---

## 🎯 Objetivos do Projeto

O PixScale foi desenvolvido para estudar e demonstrar conceitos como:

- **Arquitetura de Microsserviços**
- **Clean Architecture**
- **Event-Driven Architecture**
- **Apache Kafka**
- **Processamento assíncrono**
- **Idempotência**
- **Controle de concorrência**
- **Transações ACID**
- **Circuit Breaker**
- **Health Checks**
- **JWT e criptografia**
- **Observabilidade**
- **Separação de responsabilidades**
- **Tolerância a falhas**
- **Escalabilidade horizontal**

Mais do que implementar uma API, o objetivo do projeto é explorar **decisões de arquitetura e engenharia aplicadas a sistemas distribuídos**, utilizando um cenário financeiro como contexto de estudo.

---

## 🤖 Uso de IA no Desenvolvimento

A **Inteligência Artificial foi utilizada como ferramenta de apoio durante o desenvolvimento do projeto**, principalmente para:

- exploração de conceitos técnicos;
- discussão de decisões arquiteturais;
- análise de alternativas de implementação;
- aprendizado e aprofundamento de tecnologias;
- revisão e evolução da documentação.

A utilização de IA faz parte do próprio processo de aprendizado e desenvolvimento do case, mas as decisões de implementação e a integração dos componentes foram realizadas no contexto do projeto.

---

## 📌 Status

### ✅ Estudo concluído

O PixScale é considerado um **case de estudo concluído**, desenvolvido para consolidar conhecimentos relacionados a Backend, Microsserviços, Mensageria e Sistemas Distribuídos.

O projeto não tem como objetivo reproduzir uma plataforma bancária completa ou atender requisitos de produção. Seu propósito é demonstrar conceitos técnicos e decisões de engenharia em um cenário distribuído.

---

## 👨‍💻 Autor

**Adalto Linhares**

Projeto desenvolvido para estudo e demonstração de:

**Backend · Microsserviços · Sistemas Distribuídos · Mensageria · Arquitetura de Software · Engenharia de Software**

---

## 📄 Licença

Este projeto está disponível para fins de estudo e demonstração.
