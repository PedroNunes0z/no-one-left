# No One Left

Jogo 2D top-down de sobrevivência contínua, com TypeScript, Phaser 3, Arcade Physics, Vite e mapa Tiled. Interface em português. O objetivo é resistir pelo maior tempo possível: não há fuga, resgate nem tela de vitória.

## Executar

Requer Node.js 22.17+ e npm.

```powershell
npm install
npm run dev
npm test
npm run build
npm run preview
```

O Vite informa o endereço local, normalmente http://127.0.0.1:5173. O build fica em `dist/`; `vercel.json` configura o deploy na Vercel. Nenhum backend é necessário para esta versão offline.

## Sistemas

- Vida, fome, sede, energia, infecção e proteção. Alimentação estragada e água contaminada causam doença. Antibióticos e água purificada ajudam a sobreviver.
- Personagem de `assets/Character`: quadros de 128 × 128, 14 colunas e oito direções em ordem horária (direita, sudeste, sul, sudoeste, esquerda, noroeste, norte, nordeste). Animações de movimento, agachamento, defesa e golpe não misturam linhas de direção.
- Três bunkers com interiores próprios reduzidos para aproximadamente metade do tamanho anterior. Camas, cadeiras e armários usam proporções compatíveis com o personagem. Descanso, depósitos, purificação e reforços continuam disponíveis.
- Sete variantes de infectados: caminhante, corredor, espreitador e os quatro novos `Zombie_1`–`Zombie_4` de `assets/NormalZombie`. Todos usam animações próprias de repouso, caminhada, ataque, dano e morte. Patrulhas têm destinos persistentes; ataques têm duração protegida. Barras de vida aparecem apenas sobre os zumbis. Até 24 infectados iniciais; reforços de 4–8 a cada seis minutos ativos, limite de 48 vivos; a perseguição se intensifica gradualmente.
- Ilha de 4.800 × 3.840 pixels organizada em Bairro da Estação, Vila do Sul, Bairro do Pinhal e Zona de Exclusão. São 33 casas, nove construções isométricas com telhados, 212 tiles de estrada conectados e 109 árvores. As fachadas ficam recuadas das vias; as ruas formam quarteirões, acessos e cruzamentos contínuos. Somente seis carros do `Car.png` original. O pântano morto, o lago e a costa usam terreno próprio, sem asfalto sob a água. Água reduz a velocidade e gasta energia; cruzar a faixa profunda externa causa afogamento.
- A zona radioativa fica no nordeste, com solo amarronzado/amarelado, usina nuclear, sinalização, som de contador Geiger, infecção e dano progressivo. O vulcão usa `lavaCone00.png` no noroeste.
- O prólogo ocupa a tela inteira com fundo preto, `Neclear-usine.png`, a frase “Um jogo baseado em histórias reais” e a narração fornecida. O botão garante o gesto exigido pelo navegador antes de reproduzir o áudio e liberar o menu.
- O modo História oferece um lobby pacífico sem zumbis, PvP, dano ou desgaste de necessidades. A praça tem fogueira animada em oito quadros, oito bancos e uma casa de música que alterna as seis faixas de `Eletronic_Music`. Cruzar o limite informa que a continuação da história será implementada depois.
- Maioria dos recursos em móveis, armários e porta-malas. E abre a pesquisa do móvel; os conteúdos só aparecem depois da pesquisa. Há poucos itens no chão, sem brilho, contorno, partículas ou etiquetas flutuantes.
- Inventário com grade e arraste por mouse/toque; setas também movem o item selecionado. Garrafas ocupam 1 × 2, madeira 3 × 1, pistola 2 × 2 e mochilas até 3 × 3. Espaços sobrepostos e posições fora da grade são rejeitados.
- Mochila I: 6 × 5 espaços, 12 kg de capacidade, 0,8 kg própria. II: 7 × 6, 22 kg, 1,3 kg. III: 8 × 7, 35 kg, 2 kg. A capacidade inclui o peso da mochila. Mochilas melhores são encontradas em móveis; a anterior volta para a grade ao equipar.
- Cada instância tem peso, quantidade e durabilidade. A arma perde durabilidade a cada disparo e pode ser reparada com duas sucatas. Alimentos deterioram com o tempo; alimento muito deteriorado causa infecção. Itens soltos preservam seu estado.
- Cinco atalhos escolhidos pelo jogador, por arraste ou seleção seguida de clique no espaço. Os atalhos referenciam IDs persistentes e acompanham itens reposicionados. Soltar ou consumir a última unidade limpa o atalho.
- Somente o traçante amarelo, sem clarão, efeito instantâneo ou animação com flash. Origem medida nas oito direções da arma. Atirar reduz a velocidade de movimento em 72% por 0,48 s após cada disparo. O personagem sempre acompanha a direção da mira. Iluminação mais sombria, névoa leve, ciclo de dia/noite e trilhas ambientais que alternam por tempo, bioma e horário.
- Interface com metal gasto, tecido e granulação discreta. Minimapa local orientado ao norte, com posição, direção, água, vias, casas, bunkers e acampamentos. Não revela inimigos ou itens. Campo de visão direcional com sombras atrás dos obstáculos: áreas fora dele ficam quase pretas. Copas e fachadas visíveis permanecem legíveis.
- Frutas caem de árvores e perdem frescor em oito minutos ativos; depois viram alimento estragado e, se deixadas no chão, decompõem em três minutos. A durabilidade preserva o frescor entre salvamentos e coletas. Até 24 frutos no chão evitam acúmulo. Alimentos enlatados duram mais; carne crua e batata precisam ser assadas, consumindo madeira, junto a uma fogueira ou no fogão do bunker.
- Novos alimentos e materiais de Foods e Variable: frutas, legumes, enlatados, suco, carne, bateria, fios, combustível, couro, corda, pregos, fósforos, isqueiro, máscaras, colete e visor noturno, entre outros. Receitas permitem construir fogueiras e reforçar abrigos com os novos materiais.
- Defesa: segure Q; consome energia, impede tiros/socos simultâneos e bloqueia 75% dos ataques corpo a corpo quando há pelo menos 8 de energia. Ataques que atravessam a defesa aplicam dano normalmente. Agachar reduz a percepção em 88%, mas disparos continuam audíveis.
- Salvamento local a cada 15 segundos e nas transições. Saves antigos são migrados para a grade e deixam de ter contagem de resgate. Menus pausam a simulação. Descansar avança o relógio do mundo, mas não aumenta artificialmente o recorde de tempo ativo.

## Controles

| Ação                                          | Controle               |
| --------------------------------------------- | ---------------------- |
| Mover                                         | WASD / setas           |
| Correr                                        | Shift                  |
| Alternar agachado / em pé                     | Ctrl                   |
| Defender corpo a corpo                        | Q, segurar             |
| Dar soco                                      | F                      |
| Atirar                                        | Botão esquerdo         |
| Mirar com pequeno zoom                        | Botão direito, segurar |
| Liberar / ocultar mouse                       | U                      |
| Interagir / pesquisar / pegar / entrar / sair | E                      |
| Recarregar                                    | R                      |
| Soltar item selecionado ou do atalho ativo    | G                      |
| Usar atalhos configurados                     | 1–5                    |
| Inventário / fabricação                       | I / Tab                |
| Mapa / pausa                                  | M / Esc                |

O cursor começa oculto na área do jogo. U pode capturar o mouse via Pointer Lock; navegadores sem suporte continuam usando cursor oculto e mira absoluta. Abrir um painel libera o cursor. Touch oferece movimento, corrida, interação, soco, tiro, agachamento alternável, defesa e mira.

## Preparação para multiplayer

Ainda não há rede, conexão, lobby, sockets, matchmaking ou sincronização entre computadores.

`src/session.ts` define `AuthorityPort`, envelopes `Command` com `actorId` e sequência monotônica, intenções de movimento e `SessionSnapshot` versionado. `LocalSession` é a autoridade offline usada pelo jogo: valida comandos, rejeita repetições, controla inventário, coleta por ID/distância, fabricação, consumíveis, depósitos, munição, recarga, desgaste e dano. Estados de movimento, sala, cooldowns e recarga são isolados por ID de jogador. Snapshots incluem recursos do mundo com IDs estáveis. Sobrevivência avança em passos fixos de 30 Hz. Jogadores e inimigos têm IDs; snapshots são dados serializáveis e cópias independentes.

`src/game.ts` é o adaptador Phaser de física e apresentação: recebe input, envia comandos, aplica movimento/collisões locais e desenha entidades, animações, efeitos, HUD e interiores. `src/model.ts` contém regras puras e persistência; `src/world.ts` centraliza geometria de biomas, direção e escala de interiores. Nenhum objeto Phaser entra no contrato de sessão. Uma futura implementação pode substituir a autoridade local pelo cliente de um servidor; ainda precisará implementar transporte, autoridade física no servidor, replicação, reconciliação e interpolação. Esta versão não simula jogadores remotos.

## Assets e áudio

`public/asset-inventory.json` cataloga os arquivos fornecidos. `src/assets.ts` carrega os recortes e animações usados. `public/maps/wasteland.json` é editável no Tiled; a camada `World` define árvores, carros e objetos. Coordenadas de abrigos devem acompanhar `SHELTERS` em `src/model.ts`. Bairros, casas, vias, construções, geometria da água, zona nuclear e pântano ficam em `src/world.ts`. As descrições `.txt` dos packs isométricos e do pântano foram usadas para definir recortes, transparência e função de cada textura.

Dead-swamp: **Sevarihk / Aurora**, crédito exigido no README do pack. Os demais gráficos foram fornecidos pelo usuário. Créditos completos e fontes dos novos áudios estão em [CREDITS.md](CREDITS.md) e na página de créditos acessível pelo menu.

A trilha original de piano e cordas sintetizadas foi mantida. Adicionadas duas trilhas CC0 de yd, gravações de tiro de Vincent Sevedge / Tabasco, recarga/manuseio com airsoft de SpringySpringo, passos editados por TinyWorlds, porta metálica e grilos de Ted Kerr. Gritos de zumbis, impactos, vento leve e a trilha base continuam procedurais; não são gravações de campo.

`scripts/fetch-audio.mjs` baixa os originais de fontes com licença aberta; `scripts/prepare-recordings.mjs` extrai um disparo do arquivo de pistola e prepara os passos já descompactados. O mixer ajusta ganhos individuais a partir de níveis medidos: manuseio, recarga e porta ficam abaixo do tiro; trilhas têm ganhos próprios e transição de 1,6 s; passos variam discretamente o ritmo e sons de infectados atenuam por distância e obstáculos. Um compressor na saída controla os picos. Arquivos utilizados ficam em `public/audio/recorded/`. `npm run world` regenera somente o mapa ampliado a partir de `src/world.ts` e `scripts/expand-world.mjs`; isso substitui edições manuais do Tiled. `node --experimental-strip-types scripts/generate-world.mjs` também regenera os WAVs procedurais.

## Verificação

`npm test`: 32 testes de regras, grade, peso, mochilas, IDs, durabilidade, drops, migração, validação de saves, comandos repetidos, coleta distante, snapshots, vias, ricochetes e áudio espacial. `npm run build`: TypeScript e build Vite. A validação visual cobre prólogo, menu, lobby História, sobrevivência, HUD, malha urbana e zona nuclear em navegador real.

Atualização de ruas, luz e áudio:

- Menu em grid responsivo, com layout compacto em paisagem e botão de áudio. A música começa no menu após a interação necessária para desbloquear o áudio no navegador e continua ao voltar da partida.
- Oclusão com borda desfocada, opacidade externa de 86% e transição temporal de aproximadamente 100 ms. A máscara acompanha a câmera; móveis, casas e decoração visíveis recebem iluminação completa, ignorando apenas o próprio corpo de colisão na consulta de visibilidade.
- 33 casas e 19 corredores viários formam 212 tiles conectados. O asfalto usa os tiles originais de `assets/Map/Roads`, convertidos sem alterar seus pixels de TGA para PNG por `npm run roads`. Tiles que intersectam o oceano ou o lago são excluídos. O chão usa as novas texturas de `assets/Map/Grass`, sem asfalto embutido. Decoração de rua em `Objects`; seis carros originais preservados.
- Passos individuais dos zumbis com Web Audio HRTF, distância de referência de 35 unidades, raio máximo de 400 e atenuação adicional atrás de obstáculos. Limite de 16 vozes simultâneas, com limpeza ao pausar, reiniciar e sair. O ouvinte acompanha o jogador; outros movimentos visíveis ou ocultos podem ser ouvidos.
- Glock, rifle e sniper selecionáveis no inventário ou na hotbar, com dano, cadência, carregadores, recarga e durabilidade próprios. A reserva de munição é compartilhada nesta versão. Rifle e sniper podem ser encontrados em armários e porta-malas. Carregadores preservados ao trocar de arma e no save.
- Sons fornecidos em `assets/Sounds`: disparo de rifle, recargas de Glock/rifle, cápsula caindo, impacto/ricochete, passagem próxima de bala, voz de zumbi e drone ambiente. O pacote não contém gravações exclusivas de disparo de Glock e sniper: a Glock mantém o disparo gravado anterior; a sniper usa a gravação de rifle com taxa de reprodução reduzida. Os nomes das armas não representam gravações específicas desses modelos.
- As referências solicitadas `creature-hellhound-step-01.wav` e `creature-hellhound-step-02.wav` não estão presentes no diretório recebido. O Wild usa `heavy_footsteps.wav` e `heavy_footsteps-02.wav`, os dois sons de passo pesados disponíveis em `assets/Sounds/Zombies`.
- Ricochete de impacto somente a menos de 120 unidades do ouvinte. Passagem próxima somente de projéteis de outro dono a menos de 75 unidades da trajetória; nunca do próprio disparo. `presentProjectile` recebe eventos com dono, id e segmento, elimina reprodução duplicada e posiciona a fonte no ponto mais próximo. Preparado para eventos replicados futuros; sem conexão multiplayer implementada.
