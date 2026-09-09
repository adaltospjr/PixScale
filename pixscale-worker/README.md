# ⚡ PixScale - Distributed Core Banking Platform

O **PixScale** é um ecossistema de microsserviços financeiros de alta performance e escala, projetado sob os conceitos de **Clean Architecture** e **Event-Driven Architecture** para orquestrar e liquidar transações Pix com resiliência de nível bancário.

Este repositório consolida a fundação técnica do ecossistema, demonstrando o uso avançado de mensageria assíncrona, barreiras de proteção síncronas, segurança criptográfica e isolamento de concorrência nativo no banco de dados.

---

## 🏛️ Topologia do Ecossistema (Monorepo)

*   **`pixscale-gateway`:** Porta de entrada síncrona. Valida a segurança corporativa (JWT), gerencia o estado do Circuit Breaker, persiste chaves de idempotência histórica com checagem de hash de payload e despacha eventos legítimos para o barramento.
*   **`api-registration-limits`:** Engine síncrona corporativa. Avalia as regras de negócio de limite antes do processamento, calculando dinamicamente no Postgres a soma acumulada de gastos do cliente no dia corrente (`SUM` + `FILTER`).
*   **`pixscale-worker`:** Motor assíncrono transacional. Consome as mensagens do Kafka e opera a liquidação física de saldo e a trava de concorrência em um único bloco atômico no banco de dados.

---

## 🚀 Engenharia de Resiliência & Padrões de Produção

### 1. Resiliência de Malha e Tolerância a Falhas
*   **Circuit Breaker Formal:** Implementado nas chamadas HTTP entre o Gateway e a API de Limites. Gerencia os estados `CLOSED`, `OPEN` e `HALF_OPEN` com cooldown configurável, evitando o travamento de threads por efeito dominó se o microsserviço de limites oscilar.
*   **Health Checks Dinâmicos (`/health/live` e `/health/ready`):** Monitoramento ativo de prontidão. A rota `ready` executa checagens físicas reais (`ping()`) contra as dependências do microsserviço (PostgreSQL, barramentos e APIs de apoio), devolvendo `503 Service Unavailable` em caso de indisponibilidade de infraestrutura.

### 2. Idempotência Relacional Atômica (PostgreSQL State Machine)
*   **Controle de Concorrência via Restrição Única:** O `pixscale-worker` delega a segurança contra reprocessamento e cliques duplos diretamente para o motor do **PostgreSQL**. 
*   **Mecânica `ON CONFLICT`:** Ao consumir um evento, a transação inicia tentando registrar a chave na tabela de transações (`INSERT ... ON CONFLICT DO NOTHING`). Se a restrição única do índice for violada, o banco aborta a inserção instantaneamente (`rowCount === 0`). O repositório intercepta o evento, efetua o `ROLLBACK` e devolve o status `DUPLICATE`, blindando as contas de débito e crédito contra movimentações duplicadas em cenários de alta concorrência.
*   **Garantia ACID Nativa:** Todas as transferências operam em blocos isolados (`BEGIN`, `COMMIT`, `ROLLBACK`) usando SQL puro parametrizado (`$1`, `$2`), eliminando o overhead de ORMs e prevenindo vulnerabilidades de SQL Injection.

### 3. Segurança e Autenticação Bancária
*   **Autenticação JWT Criptográfica Nativa (`JwtGuard`):** Validação manual de tokens assinados em algoritmo `HS256` utilizando estritamente o módulo `node:crypto`. O guard verifica de forma rígida as claims obrigatórias (`sub`, `exp`, `iss`, `aud`) e previne ataques de temporização (*timing attacks*) por meio da função de comparação em tempo constante `timingSafeEqual`.

### 4. Observabilidade e Auditoria
*   **Módulo StructuredLogger:** Emissão de logs padronizados em estruturas JSON nativas para a saída padrão (stdout), facilitando o parse, agregação e indexação automatizada em ferramentas de APM de mercado (como Datadog, Splunk ou ELK Stack).

---

## 🛠️ Stack Tecnológica

*   **Runtime & Framework:** Node.js, NestJS, TypeScript
*   **Mensageria:** Apache Kafka (KRaft Single-Broker local no Docker)
*   **Banco de Dados:** PostgreSQL (Persistência e Idempotência Relacional ACID)
*   **Segurança:** JWT (HMAC-SHA256 nativo via `node:crypto`)
