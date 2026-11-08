# SpaceCat — Guía paso a paso

Esta guía te lleva desde el zip hasta tener el juego en tu propio repositorio de GitHub,
jugable desde un enlace, y listo para importar tus gráficos.

---

## 1. Descomprime y prueba el juego

1. Descomprime `SpaceCat.zip`. Obtendrás una carpeta `SpaceCat/`.
2. Abre `index.html` con doble clic (se abre en tu navegador).
3. Pulsa **Enter** o haz clic en la pantalla para empezar.

> Si lo abres desde una tablet o celular, algunos navegadores no abren archivos locales.
> En ese caso salta al paso 4 (GitHub Pages) y juega desde el enlace.

---

## 2. Crea el repositorio en GitHub

1. Entra a <https://github.com> e inicia sesión.
2. Arriba a la derecha, pulsa **+** → **New repository**.
3. **Repository name:** `SpaceCat`
4. Elige **Public** (necesario para publicar gratis con GitHub Pages).
5. **No marques** "Add a README", ni `.gitignore`, ni licencia (el proyecto ya trae sus archivos).
6. Pulsa **Create repository**.

---

## 3. Sube los archivos

### Opción A — Desde el navegador (sin instalar nada, en computadora)

1. En la página del repo nuevo, pulsa el enlace **uploading an existing file**.
2. Abre la carpeta `SpaceCat/` descomprimida, selecciona **todo su contenido**
   (`index.html`, `css`, `js`, `assets`, `README.md`, `GUIA_PASO_A_PASO.md`, `.gitignore`, `.nojekyll`)
   y arrástralo a la ventana. **No subas el .zip ni la carpeta contenedora**: `index.html` debe quedar en la raíz del repo.
3. Abajo, en **Commit changes**, escribe `Base inicial de SpaceCat` y pulsa **Commit changes**.

> Algunos archivos empiezan con punto (`.gitignore`, `.nojekyll`) y pueden estar ocultos en tu explorador.
> Si no los ves, no pasa nada: el juego funciona igual. Lo importante es subir `index.html`, `css/`, `js/` y `assets/`.

### Opción B — Con Git (computadora con Git instalado)

Abre una terminal dentro de la carpeta `SpaceCat/` y ejecuta (cambia `TU_USUARIO`):

```bash
git init
git add .
git commit -m "Base inicial de SpaceCat"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/SpaceCat.git
git push -u origin main
```

---

## 4. Publica el juego con GitHub Pages (para jugarlo desde un enlace)

1. En tu repo: **Settings** → **Pages** (menú de la izquierda).
2. En **Build and deployment** → **Source**: elige **Deploy from a branch**.
3. **Branch:** `main`, carpeta `/ (root)` → **Save**.
4. Espera 1–2 minutos y recarga. Arriba aparecerá el enlace:
   `https://TU_USUARIO.github.io/SpaceCat/`
5. Abre el enlace en tu tablet o celular: ¡ya puedes jugar! (en horizontal).

---

## 5. Importa tus gráficos

El juego ya se ve completo sin imágenes. Cuando tengas las tuyas, solo hay que ponerlas en
`assets/images/` con estos nombres exactos:

| Archivo | Qué es | Tamaño recomendado |
|---|---|---|
| `cat.png` | El gato (mirando a la derecha, pies abajo al centro, fondo transparente) | 144 × 144 |
| `star.png` | Estrella coleccionable | 64 × 64 |
| `asteroid.png` | Asteroide obstáculo | 96 × 96 |
| `goal.png` | Portal / meta del punto B | 240 × 320 |
| `background.png` | Fondo del cielo | 1920 × 1080 |

Para subirlas a GitHub: entra a la carpeta `assets/images` en tu repo → **Add file** → **Upload files**
→ arrastra las imágenes → **Commit changes**. En ~1 minuto se actualiza el enlace de GitHub Pages
(si no cambia, recarga forzando: Ctrl + Shift + R).

Si falta alguna, el juego usa el dibujo por defecto de esa pieza.

---

## 6. Ajusta el juego a tu gusto

| Quiero... | Archivo | Qué tocar |
|---|---|---|
| Más fácil / más difícil | `js/config.js` | `LIVES`, `JUMP_SPEED`, `MOVE_SPEED`, `GRAVITY` |
| Cambiar colores | `js/config.js` | bloque `COLORS` |
| Cambiar el recorrido | `js/levels.js` | `ground`, `platforms`, `spikes`, `asteroids`, `stars` |
| Crear otro nivel | `js/levels.js` | copia el objeto del nivel y cámbiale los números |

Después de editar un archivo, vuelve a subirlo a GitHub (o haz `git add . && git commit -m "..." && git push`).

---

## 7. Controles

- **Teclado:** ← → (o A D) para moverte, Espacio / ↑ / W para saltar, P para pausa, M para sonido.
- **Tablet / celular:** botones en pantalla (◀ ▶ y ▲) y botón de pausa arriba a la derecha.

---

## 8. Siguientes pasos sugeridos

1. Importar tus gráficos (paso 5).
2. Añadir música y sonidos propios (carpeta `assets/audio/`).
3. Crear más niveles y un menú para elegirlos.
4. Nuevos obstáculos: enemigos que caminan, plataformas que caen, viento espacial.
5. Pantalla de créditos y logo.
