# Imágenes de SpaceCat

Coloca aquí tus imágenes **con estos nombres exactos**. Si un archivo no está, el juego dibuja
la versión por defecto, así que puedes ir importando de una en una.

| Archivo | Qué es | Tamaño recomendado | Notas |
|---|---|---|---|
| `cat.png` | El gato | 144 × 144 px | Mirando a la **derecha**, fondo transparente, pies en el borde de abajo y centrado. Se dibuja a 72 × 72. |
| `star.png` | Estrella coleccionable | 64 × 64 px | Fondo transparente. Se dibuja a ~32 × 32. |
| `asteroid.png` | Asteroide obstáculo | 96 × 96 px | Fondo transparente, redondo. Gira solo. |
| `goal.png` | Portal / meta del punto B | 240 × 320 px | Fondo transparente, base abajo y centrada. Se dibuja a 120 × 160. |
| `background.png` | Fondo del cielo | 1920 × 1080 px | Cubre toda la altura y se desplaza con efecto de profundidad. |

Solo se leen archivos `.png`.

Si quieres cambiar tamaños o agregar más piezas (suelo, plataformas, cristales), se hace en
`js/assets.js` y `js/render.js`.
