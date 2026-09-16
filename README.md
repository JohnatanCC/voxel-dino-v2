# Voxel Dino

Um endless runner 3D em estilo voxel, inspirado no clássico jogo do T-Rex do Chrome — construído para rodar direto no navegador (desktop e mobile).

## Stack

- **React 19** + **TypeScript**
- **Three.js** / **React Three Fiber** + **@react-three/drei** para renderização 3D
- **Zustand** para o estado global do jogo
- **Tailwind CSS v4** + **Framer Motion** (`motion/react`) para a interface
- **Vite** para build/dev server, com **vite-plugin-pwa** para suporte offline/instalável

Consulte o [GUIDE.md](GUIDE.md) para as diretrizes de arquitetura, estilo de código e otimização de renderização 3D usadas no projeto.

## Rodando localmente

Pré-requisito: Node.js.

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — inicia o servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — serve o build de produção localmente
- `npm run lint` — checagem de tipos (`tsc --noEmit`)
- `npm run test` — roda os testes unitários (`test/gameStore.test.ts`)
- `npm run clean` — remove as pastas de build (`dist/`, `dev-dist/`)
