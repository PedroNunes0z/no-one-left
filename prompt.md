## No one Left

Um jogo pós-apocalíptico de sobrevivência 2D top-down, onde o jogador deve explorar um mundo devastado, coletar recursos, enfrentar inimigos e tomar decisões estratégicas para garantir a sobrevivência.

> IMPORTANTE: Leia e entenda toda a pasta /assets e use os arquivos de imagem, tilemaps para criar o jogo.

### O player: "O jogador é um sobrevivente em um mundo pós-apocalíptico, onde deve coletar recursos, construir abrigos e enfrentar zumbis para garantir a sobrevivência."

Possui:

- Vida
- Fome
- Sede de água
- Doenças: "O jogador pode contrair doenças ao se expor a ambientes insalubres ou ao consumir alimentos e água contaminados. As doenças podem afetar a saúde, a energia e a capacidade de realizar ações."
- Stamina: "A stamina representa a energia do jogador para realizar ações físicas, como correr, lutar ou carregar objetos. A stamina diminui com o esforço físico e se recupera com descanso e alimentação adequada."
- Proteção: "O jogador pode encontrar ou criar equipamentos de proteção, como roupas resistentes, capacetes e coletes à prova de balas, que ajudam a reduzir o dano recebido de ataques inimigos e ambientes perigosos."

### Os zumbis: "Zumbis são inimigos que perseguem o jogador e podem causar dano. Eles possuem diferentes tipos, cada um com habilidades e comportamentos distintos."

Possui:

- Vida
- Dano
- Velocidade
- Comportamento: "Cada tipo de zumbi possui um comportamento único, como perseguir o jogador, atacar em grupo ou se camuflar no ambiente. O jogador deve aprender a identificar e lidar com cada tipo de zumbi para sobreviver."

### Ambientação: "O jogo se passa em um mundo devastado por um apocalipse, com cidades destruídas, florestas sombrias e áreas perigosas. A atmosfera é tensa e obscura."

- Clico de dia e noite: "O jogo possui um ciclo de dia e noite, onde a iluminação e a visibilidade mudam, afetando a jogabilidade. Durante a noite, os zumbis se tornam mais agressivos e difíceis de detectar."
- Loot: "O jogador pode encontrar recursos e itens espalhados pelo mundo, como alimentos, água, armas. O loot é gerado de forma aleatória e pode variar em local e quantidade (sem exagero)."
- Música estilo violino e piano: "A trilha sonora do jogo é composta por músicas de violino e piano, criando uma atmosfera tensa e melancólica"
- Efeitos sonoros: "O jogo possui efeitos sonoros realistas, como passos, gritos de zumbis, portas rangendo e sons ambientais, que aumentam a imersão do jogador no mundo pós-apocalíptico."
- Três bankers pelo mapa (está em assets/EspecialRoom/Shelters): "O jogador pode encontrar três abrigos espalhados pelo mapa, onde pode descansar, se proteger de zumbis e armazenar recursos. Cada abrigo possui interiores únicos, incentivando a exploração do mundo do jogo."

### Menu

- Fundos se alternam entre imagens do mundo devastado e do jogador em ação em assets/MenuBG.

# Stack

### TypeScript + Phaser + Vite + Tiled

| Parte          | Tecnologia            |
| -------------- | --------------------- |
| Linguagem      | TypeScript            |
| Engine         | Phaser 3              |
| Build          | Vite                  |
| Mapas          | Tiled                 |
| Física         | Phaser Arcade Physics |
| Animações      | Sprite Sheets         |
| Áudio          | Phaser Sound          |
| Interface      | Phaser + HTML/CSS     |
| Ranking online |                       |
| Deploy         | Vercel                |

---

## 🕹️ Phaser 3

O **Phaser** será responsável pela maior parte da estrutura do jogo.

Ele possui suporte para:

- Sprites
- Sprite Sheets
- Animações
- Tilemaps
- Câmera
- Física
- Colisões
- Partículas
- Áudio
- Teclado
- Mouse
- Touch
- Game Loop
- Gerenciamento de cenas

Estrutura:

    TypeScript
        │
        ├── Phaser
        │    ├── Renderização
        │    ├── Sprites
        │    ├── Animações
        │    ├── Física
        │    ├── Colisões
        │    ├── Câmera
        │    ├── Áudio
        │    └── Input
        │
        ├── Tiled
        │    └── Mapas / Tilemaps
        │
        └── Vite
             └── Build / Desenvolvimento

---
