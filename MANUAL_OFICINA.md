# 📜 MANUAL DE INSTRUÇÕES - OFICINA DE PINBALL

Bem-vindo à **Oficina de Pinball**! Este documento contém a documentação completa de todas as peças, mecânicas, controlos e missões disponíveis para desenhares e jogares nas tuas próprias mesas de arcada néon ou clássicas.

---

## 🎮 1. CONTROLOS & BASES DO JOGO

O principal objetivo é acumular o máximo de pontos mantendo a bola viva no campo de jogo e impedindo que ela caia no **dreno** inferior.

### CONTROLOS NO PC
*   **Flippers:** Move os flippers com as setas do teclado `⬅️ ➡️` ou as teclas `A` / `D`.
*   **Lançador / Mola:** Mantém pressionada a tecla `ESPAÇO` ou `SETINHA ABAIXO` `⬇️` para recuar o plunger, e solta para lançar a bola com força.
*   **Abanar Mesa (Nudge):** Pressiona `SETINHA ACIMA` `⬆️` ou a tecla `N`. Isto abana fisicamente a mesa de jogo, exercendo uma pequena força na bola para a libertar se estiver presa ou desviar a sua trajetória.

### CONTROLOS MOBILE (TABLETS & TELEMÓVEIS)
*   **Flippers:** Clica em qualquer lado na metade inferior esquerda/direita do ecrã para acionar os respetivos flippers.
*   **Lançar Bola:** Clica e solta com os dois dedos em simultâneo na zona dos flippers.
*   **Abanar Físico (Shake):** Dá um pequeno e vigoroso abanão físico no teu telemóvel para ativar a mecânica de **Nudge** e libertar a bola via acelerómetro!

---

## 🧱 2. ESTRUTURAS & OBSTÁCULOS (PREGOS E BUMPERS)

### 📌 PREGO / PINO
*   **Funcionamento:** Um pequeno pilar metálico estacionário.
*   **Objetivo:** Funciona como um pivô físico para desviar a trajetória da bola e construir caminhos guiados na mesa.

### 🛡️ PINO SALVADOR (ESCUDO TEMPORAL)
*   **Funcionamento:** Um pilar especial rodeado por uma barreira energética pontilhada.
*   **Objetivo:** Salva a bola da morte certa ao ressaltá-la com força de volta para o jogo! Fica apenas ativo durante **30 segundos** e pode ser prolongado. Para o ativares, tens de acertar 9 vezes no **Alvo Permanente**.

### 🧱 PAREDE NORMAL
*   **Funcionamento:** Segmento rígido configurável. No editor, podes criar retas perfeitas ou curvas Bezier suaves com múltiplos pontos de controlo.
*   **Objetivo:** Definir as fronteiras do mapa, rampas, carris e túneis de aceleração.

### ⚡ PAREDE ELÁSTICA
*   **Funcionamento:** Um elástico esticado revestido a néon ou borracha clássica.
*   **Objetivo:** Reage com enorme energia ao impacto físico. Quando a bola lhe bate, recebe um forte **Boost de Velocidade** perpendicular para longe da parede.

### 💥 BUMPERS (CIRCULARES & TRIANGULARES)
*   **Funcionamento:** Cogumelos ativos (tamanhos Pequeno ou Grande) e triângulos com sensores de pressão integrados.
*   **Objetivo:** Empurram a bola com força brutal radial em qualquer direção de impacto, ativando brilho visual e som característico. Quantos mais bumpers colocares, mais caótico e excitante será o jogo!
*   **Pontuação:** Dão pontuações imediatas que escalam consoante a velocidade da bola!

---

## 🎯 3. ALVOS & BURACOS

### 🎯 ALVOS COMUNS (TARGETS)
*   **Funcionamento:** Alvos mecânicos numerados que caem para dentro da mesa quando atingidos.
*   **Objetivo:** Derruba **TODOS** os alvos ativos da mesa para completares a ronda. Assim que derrubares o último:
    1. O nível do Jackpot sobe em +1 unidade.
    2. Recebes um **Super Bónus de Pontos** imediato.
    3. Todos os alvos voltam a erguer-se para a próxima ronda!

### 🎯 ALVO PERMANENTE
*   **Funcionamento:** Alvos redondos amarelos que não caem, registando o número consecutivo de batidas de 1 a 9.
*   **Objetivo:** Ao atingir a **9ª batida consecutiva**, ativa (ou prolonga em +30 segundos) o escudo do **Pino Salvador** na base da mesa!

### 🕳️ BURACO NORMAL
*   **Funcionamento:** Um buraco na mesa com força de atração íman.
*   **Objetivo:** Suga a bola para o seu centro e ejeta-a segundos depois numa direção aleatória em 360º.
*   **Missão de Exploração:** Entra em **TODOS** os buracos normais espalhados pela mesa para obteres uma **Bola Extra** instantânea!

### 🟢🔴🔵🟡 BURACO PROTEGIDO (CAIXAS)
*   **Funcionamento:** Câmaras blindadas seladas por uma barreira laser colorida (Verde, Vermelho, Azul, Amarelo).
*   **Objetivo:** As portas começam trancadas. Deves atingir e acender todas as **Luzes Néon** da cor correspondente na mesa para abrir a porta laser.
*   **Uso:** Uma vez aberta, a câmara suga a bola e garante **+3.000 PTS**. Assim que a bola sair, a porta volta a trancar e as luzes apagam-se, permitindo reiniciar o processo!

---

## 🌀 4. PORTAIS DIMENSIONAIS INTER-MESAS

No modo Editor, qualquer **Buraco Protegido** pode ser transformado num **Warp Portal** ligando várias mesas diferentes no teu PC ou VPS!

1.  **Configuração:** Clica no ícone `🔗` ao lado do buraco no Editor e escreve o nome da mesa de destino.
2.  **Ativação no Jogo:** Acende as luzes corretas para abrir o laser do portal e deixa a bola entrar!
3.  **A Viagem:** A bola é desmaterializada e viajas instantaneamente para a nova mesa. Se for a tua primeira exploração dimensional nessa ronda, ganhas uma **Bola Extra**!
4.  **Retorno:** O teu score e bolas mantêm-se intactos. A exploração na sub-mesa é segura: se a bola cair no dreno da sub-mesa, um **Portal de Retorno** abre-se e regressas à mesa principal pela mesma câmara de onde saíste, ejetando a bola de volta ao jogo principal sem perderes bolas!

---

## 🎰 5. ROTATIVOS & SLOT MACHINES DA SORTE

### 🌀 SPINNER & ROLETA LARGA
*   **Funcionamento:** Placas que giram a altíssima velocidade sobre um eixo central quando a bola passa por elas.
*   **Objetivo:** Geram pontos instantâneos a cada volta que dão e mudam de cor aleatoriamente.
*   **Jackpot de Cores 🌈:** Faz com que todos os spinners e roletas da mesa parem com a **mesma cor** no visor para desbloqueares um Jackpot de Cores de **+5.000 PTS**!

### 🎰 SLOT MACHINES (LUZES DE SORTE)
*   **Funcionamento:** Aglomerados de 3 ou 4 luzes especiais (em linha, triângulo ou quadrado).
*   **Ativação:** Sempre que a bola passar por um Spinner ou Roleta, as luzes começam a rodar cores freneticamente ao estilo casino.
*   **Jackpots de Slots:**
    *   **3 Cores Iguais (Jackpot Triplo):** Atribui um bónus massivo de **+2.500 PTS**.
    *   **4 Cores Iguais (Super Jackpot):** Atribui um prémio extremo de **+5.000 PTS e uma BOLA EXTRA**!
