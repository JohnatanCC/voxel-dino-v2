# Guia de Diretrizes e Implementação (Voxel T-Rex 3D)

Este guia serve como a fonte de verdade para a arquitetura, estilo de código, otimizações 3D e fluxos de trabalho do projeto **Voxel T-Rex 3D**. O objetivo é garantir consistência de código, alto desempenho (performance 3D) e redundância zero em todas as futuras implementações.

---

## 1. Visão Geral da Arquitetura

O projeto é um jogo de corrida infinita (infinite runner) em 3D, baseado no clássico jogo do T-Rex do Chrome, utilizando gráficos estilo voxel.

### Stack Tecnológica
*   **Core**: React 19.0.1 (suporte a hooks modernos) e TypeScript.
*   **Renderização 3D**: Three.js (v0.185.1) e React Three Fiber (R3F) (v9.6.1).
*   **Utilitários 3D**: `@react-three/drei` (v10.7.7) para elementos de texto 3D, controles e helpers.
*   **Gerenciamento de Estado**: Zustand (v5.0.14).
*   **Estilização & UI**: Tailwind CSS v4 (compilado via `@tailwindcss/vite`) e Framer Motion (`motion/react` v12.23.24) para transições/overlays.
*   **Build & Dev Server**: Vite (v6.2.3).
*   **Testes**: Tsx + Assert do Node para testes unitários simplificados (`test/gameStore.test.ts`).

### Estrutura de Pastas e Componentes
```
src/
├── App.tsx                     # Orquestrador principal (Canvas, Fog, EnvironmentManager)
├── main.tsx                    # Ponto de entrada da aplicação
├── index.css                   # Definição do tema Tailwind v4 e estilos de utilidade
├── store/
│   └── gameStore.ts            # Zustand Store unificado do jogo (estado global)
├── components/
│   ├── Game.tsx                # Loop principal do jogo, câmera e detecção de colisões
│   ├── Dino.tsx                # Modelo do Dino (Voxels), física de salto/agachamento e inputs
│   ├── EnvironmentManager.tsx  # Controle de ciclo dia/noite e iluminação dinâmica
│   ├── VFXRenderer.tsx         # Renderizador de partículas altamente otimizado (instancedMesh)
│   ├── UI.tsx                  # Interface de usuário (HUD, Menus, Configurações e Touch Controls)
│   └── environment/            # Elementos secundários do cenário (Clouds, Mountains, MangroveTrees)
├── scenarios/
│   ├── types.ts                # Interfaces e offsets de hitboxes globais
│   ├── helpers.ts              # Helpers de spawn, posicionamento e lógica de powerups
│   ├── index.ts                # Registro unificado dos cenários (desert, forest, swamp, snow)
│   ├── desert/                 # Cenário de Deserto (Ground & Obstacles específicos)
│   ├── forest/                 # Cenário de Floresta (Ground & Obstacles específicos)
│   ├── snow/                   # Cenário de Neve (Ground & Obstacles específicos)
│   └── swamp/                  # Cenário de Pântano (Ground & Obstacles específicos)
└── utils/
    └── audio.ts                # Sistema de reprodução de efeitos sonoros e música de fundo
```

---

## 2. Padrões de Código (Code Style)

Para manter a base de código limpa e legível:

### Convenções de Nomenclatura
*   **Componentes React**: PascalCase (ex: `DesertGround`, `EnvironmentManager`).
*   **Arquivos React/Componentes**: PascalCase com extensão `.tsx` (ex: `Dino.tsx`).
*   **Ficheiros TypeScript de Lógica**: camelCase com extensão `.ts` (ex: `gameStore.ts`, `helpers.ts`).
*   **Constantes Globais**: UPPER_SNAKE_CASE declaradas fora dos componentes (ex: `GROUND_LENGTH = 100`).
*   **Métodos do Zustand Store**: camelCase (ex: `startGame`, `incrementScore`).

### Integração com o Zustand Store (`useGameStore`)
*   **Componentes Reativos (React)**: Utilize seletores específicos para evitar re-renderizações desnecessárias:
    ```typescript
    const status = useGameStore(state => state.status);
    const lives = useGameStore(state => state.lives);
    ```
*   **Laços de Animação e Callbacks (`useFrame`, loops)**: Não utilize hooks de seleção que causam re-render no React. Em vez disso, busque o estado de forma imperativa:
    ```typescript
    useFrame((state, delta) => {
      const speed = useGameStore.getState().getCurrentSpeed();
      // lógica que usa speed...
    });
    ```
*   **Actions**: Toda alteração no estado global deve ser tratada dentro do store (`gameStore.ts`). Não modifique diretamente variáveis de estado do store dentro de componentes.

### Tipagem e TypeScript
*   Sempre exporte ou crie tipos para novos obstáculos ou dados de jogos no arquivo [types.ts](file:///c:/Users/Windows/Documents/Projetos/voxel-t-rex-3d/src/scenarios/types.ts).
*   Evite o uso de `any` sempre que possível. Defina interfaces claras para as propriedades dos componentes.

---

## 3. Diretrizes para React Three Fiber (R3F) e Three.js

O desempenho de renderização 3D é crítico em um jogo de 60fps+. Siga as diretrizes de otimização de CPU/GPU:

### Reutilização de Geometrias e Materiais (Crucial)
*   **Regra de Ouro**: **NUNCA** declare novas instâncias de `BoxGeometry`, `MeshStandardMaterial` ou qualquer outra classe do Three.js dentro do corpo de um componente ou em loops de renderização do R3F. Isso recria objetos na GPU a cada frame, destruindo o desempenho.
*   **Como fazer**:
    1.  Declare geometrias e materiais como constantes **fora** do componente:
        ```typescript
        const leafMaterial = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });
        const leafGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        ```
    2.  Passe-os como referências aos elementos do JSX:
        ```jsx
        <mesh geometry={leafGeo} material={leafMaterial} castShadow />
        ```
    3.  Se os valores dependerem de variáveis em tempo de execução, utilize `useMemo` com dependências estritas para armazenar materiais ou texturas.

### Descarte Manual de Recursos (GC / Memory Leak)
*   Sempre que texturas forem geradas dinamicamente usando `CanvasTexture` ou canvas 2D na memória, certifique-se de descartá-las utilizando o método `.dispose()` no retorno de um `useEffect`:
    ```typescript
    const sandTexture = useMemo(() => { ... return texture; }, []);
    useEffect(() => {
      return () => {
        sandTexture.dispose();
      };
    }, [sandTexture]);
    ```

### Loops de Animação e Movimento (`useFrame`)
*   **Independência de FPS**: Qualquer movimento feito no `useFrame` (deslocamento de obstáculos, oscilação de pernas) deve ser multiplicado pelo argumento `delta` fornecido pelo R3F para garantir que o jogo rode na mesma velocidade em telas de 60Hz, 144Hz ou 240Hz:
    ```typescript
    useFrame((state, delta) => {
      obstacle.x -= speed * delta;
    });
    ```
*   **Instanciação nos Frames**: Evite declarar vetores temporários (`new THREE.Vector3()`) ou matrizes dentro do `useFrame`. Reutilize variáveis de escopo superior ou crie uma referência persistente para evitar geração constante de lixo de memória (Garbage Collector spikes).

### Renderização em Lote (`instancedMesh`)
*   Para elementos repetitivos no cenário (como pedras, poeira do chão, árvores de fundo, montanhas e partículas de efeitos), use sempre `<instancedMesh>` em vez de renderizar vários componentes `<mesh>` individuais.
*   Veja o exemplo do [VFXRenderer.tsx](file:///c:/Users/Windows/Documents/Projetos/voxel-t-rex-3d/src/components/VFXRenderer.tsx) para manipulação eficiente de matrizes usando um objeto `THREE.Object3D` auxiliar e definindo `meshRef.current.instanceMatrix.needsUpdate = true`.

### Luzes e Sombras
*   Verifique se as sombras estão desabilitadas no modo gráfico de baixa qualidade (`shadows={graphicsQuality !== 'low'}`).
*   Mantenha a frustum da câmera de sombras do `directionalLight` justa ao redor da área de jogo para maximizar a resolução dos mapas de sombra sem desperdício de GPU.

---

## 4. Regras de Redundância Zero (IA)

Esta seção serve como diretiva direta para você (a IA) para evitar gerar códigos repetidos ou recriar soluções já existentes no projeto.

1.  **Não reimplemente geradores de partículas**: Qualquer novo efeito visual de colisão, poeira ou explosão deve usar a função exportada `spawnParticles` do [VFXRenderer.tsx](file:///c:/Users/Windows/Documents/Projetos/voxel-t-rex-3d/src/components/VFXRenderer.tsx).
2.  **Não duplique o estado do jogo**: O estado de pontuação, velocidade atual com penalidades aplicadas (`getCurrentSpeed()`), vidas e status do jogo estão unificados no Zustand. Não guarde cópias desses valores localmente em componentes.
3.  **Não reimplemente o algoritmo de colisão**: O arquivo [Game.tsx](file:///c:/Users/Windows/Documents/Projetos/voxel-t-rex-3d/src/components/Game.tsx) centraliza a detecção de colisão via bounding boxes (`THREE.Box3`). Novos obstáculos devem apenas expor suas posições e tipos por meio do array referenciado em `ObstaclesComponent`.
4.  **Reutilize estruturas de cenários**: Todos os arquivos de cenário devem seguir estritamente o ecossistema modular. Use os mesmos métodos auxiliares do [helpers.ts](file:///c:/Users/Windows/Documents/Projetos/voxel-t-rex-3d/src/scenarios/helpers.ts) para calcular distâncias de spawn/despawn (`SPAWN_DISTANCE`, `DESPAWN_DISTANCE`) e espaçamento proporcional entre obstáculos.

---

## 5. Fluxo de Trabalho (Workflow)

Ao receber uma nova solicitação de implementação:

### Passo 1: Análise e Planejamento
*   Analise quais componentes 3D ou de UI serão impactados.
*   Verifique se a funcionalidade requer adição de novos tipos em `types.ts` ou se o estado global do jogo precisa de novos campos/actions em `gameStore.ts`.
*   Formule um plano antes de editar qualquer código.

### Passo 2: Alteração Incremental
*   Se a lógica exigir novos estados, implemente-os primeiro no Zustand Store (`gameStore.ts`).
*   Modifique os componentes 3D/UI apenas quando a base do estado estiver consolidada.
*   Mantenha os arquivos modulares. Não misture componentes de UI tradicionais dentro dos arquivos do cenário 3D.

### Passo 3: Validação Técnica
*   Garanta que todos os materiais e geometrias inseridos sigam as regras de reaproveitamento de memória.
*   Rode o compilador TypeScript em modo de verificação de erros:
    ```bash
    npm run lint
    ```
*   Verifique se as suítes de testes existentes ainda passam rodando:
    ```bash
    npm run test
    ```
*   Caso tenha alterado a física de salto, velocidade ou mecânicas centrais, escreva novos testes unitários em `test/gameStore.test.ts`.
