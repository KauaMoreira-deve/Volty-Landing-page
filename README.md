# Volty · site interativo

Site informativo da Volty com o conteúdo do guia, apresentado como uma viagem 3D de partículas. Cada capítulo é uma cena, e a coruja da Volty acompanha a pessoa pela página.

## Estrutura

```
volty-landing/
├── index.html          estrutura e texto dos capítulos
├── css/style.css       visual (cores, tipografia, layout)
├── js/main.js          cena 3D, partículas, coruja e interações
├── assets/             coruja (4 vistas, sem fundo) e logo
└── vendor/three.min.js three.js r128 (licença MIT em three-LICENSE.txt)
```

Não há etapa de build nem dependências para instalar.

## Como abrir

O símbolo da Volty feito de partículas lê a imagem do logo, e o navegador só permite isso quando a página é servida por um servidor. Abrindo o `index.html` com dois cliques, tudo funciona, mas a primeira cena mostra uma esfera no lugar do logo.

Para ver completo, rode um servidor simples dentro da pasta:

```bash
cd volty-landing
python3 -m http.server 8000
# ou: npx serve .
```

Depois abra http://localhost:8000.

## Publicar no GitHub Pages

1. Crie um repositório e envie o conteúdo desta pasta para a branch `main`.
2. No GitHub, abra Settings > Pages e escolha "Deploy from a branch", branch `main`, pasta `/ (root)`.
3. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Onde mexer

- **Textos:** cada capítulo é uma `<section class="scene">` no `index.html`. O atributo `data-name` é o nome que aparece no menu lateral.
- **Cores:** variáveis no topo do `css/style.css` (`--void`, `--volt`, `--ion`...). As cores das partículas ficam em `js/main.js` (`BLUE`, `ION`, `WHITE`).
- **Cenas 3D:** em `js/main.js`, cada bloco `// 0 ·`, `// 1 ·`... monta as posições das partículas de um capítulo. A lista `cam` define onde a câmera fica em cada um.
- **Falas da coruja:** array `tips` em `js/main.js`, uma por capítulo.
- **Quantidade de partículas:** constante `N` (11.000 no computador, 6.000 no celular).

Valores e preços do site são os exemplos do guia e devem ser validados antes de virar material comercial.
