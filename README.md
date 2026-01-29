# FoodCheck MiniMax

FoodCheck es una aplicación web moderna y eficiente para el seguimiento nutricional personalizado. Este proyecto es un experimento en el que se ha intentado hacer una réplica mejorada de la aplicación original FoodCheck mediante MiniMax m2.1.

## Características

La aplicación incluye las siguientes funcionalidades principales:

- **Perfil Personalizado**: Configura tus condiciones de salud (diabetes, insuficiencia renal, hipertensión, hipercolesterolemia) para obtener recomendaciones nutricionales adaptadas a tus necesidades específicas.
- **Análisis de Alimentos**: Sube fotografías de tus comidas para analizar su contenido nutricional. La aplicación detecta automáticamente alimentos comunes y permite añadir manualmente cualquier alimento no reconocido.
- **Registro Diario**: Guarda tus comidas del día y visualiza un seguimiento automático de tu ingesta nutricional acumulada.
- **Resumen Nutricional**: Visualiza el desglose completo de macronutrientes incluyendo proteínas, carbohidratos, grasas, azúcares, fibra y sodio.
- **Asistente Dietista**: Recibe sugerencias personalizadas basadas en tus condiciones de salud y los alimentos consumidos.
- **Modo Offline**: Todas tus preferencias y datos se guardan localmente en tu dispositivo, funcionando incluso sin conexión a internet.

## Tecnologías Utilizadas

El proyecto ha sido desarrollado utilizando las siguientes tecnologías y prácticas modernas:

- **HTML5 Semántico**: Estructura de documento accesible y semánticamente correcta.
- **CSS Moderno**: Utilización de CSS Custom Properties (variables CSS), Grid, Flexbox, animaciones y transiciones suaves, diseño totalmente responsivo para dispositivos móviles.
- **JavaScript ES6+**: Programación orientada a objetos con clases, funciones flecha, async/await para llamadas a APIs, promises y destructuring.
- **API de OpenFoodFacts**: Integración con la base de datos开放 de productos alimenticios para obtener información nutricional precisa.
- **LocalStorage**: Almacenamiento persistente de datos del usuario directamente en el navegador.

## Uso de la Aplicación

### Configuración del Perfil

Al iniciar la aplicación, puedes configurar tu perfil indicando las condiciones de salud que apliquen. Estas condiciones ajustarán automáticamente los objetivos nutricionales y las sugerencias personalizadas. La información se guarda localmente y permanece almacenada entre sesiones.

### Análisis de Comidas

Para analizar una comida, simplemente arrastra una fotografía al área designada o haz clic para seleccionar un archivo de imagen. La aplicación procesará la imagen y simulará la detección de alimentos comunes. Puedes añadir o eliminar alimentos según sea necesario, ajustando las cantidades y unidades de medida.

### Registro y Seguimiento

Cuando hayas completado el análisis de tu comida, guarda los alimentos para añadirlos a tu registro diario. El sistema mantiene un seguimiento acumulado de todas las comidas registradas durante el día, permitiéndote visualizar tu progreso nutricional total.

## Instalación y Ejecución

Para ejecutar este proyecto localmente, sigue estos pasos:

1. Clona o descarga el repositorio en tu máquina local.
2. Abre la carpeta del proyecto en tu editor de código favorito.
3. Si deseas visualizar la aplicación, simplemente abre el archivo `index.html` directamente en tu navegador web.
4. Para un funcionamiento óptimo, se recomienda utilizar un servidor local. Puedes usar la extensión "Live Server" de VS Code o ejecutar `npx serve` en la terminal.

## Despliegue en GitHub Pages

Esta aplicación está preparada para ser desplegada en GitHub Pages de forma sencilla:

1. Crea un repositorio en GitHub y sube los archivos del proyecto.
2. Ve a la configuración del repositorio y selecciona la rama `main` (o `master`) como fuente de publicación.
3. GitHub Pages generará automáticamente la URL de acceso a tu aplicación.

Esta aplicación es una SPA (Single Page Application) estática alojada en GitHub Pages que no requiere de un servidor backend tradicional. El procesamiento lógico y la inteligencia artificial se delegan a un Cloudflare Worker, que actúa como una función Serverless en el 'edge'. Este Worker se encarga de conectar de forma segura con el modelo LLaVA (a través de Workers AI), protegiendo las API Keys y procesando las imágenes sin necesidad de gestionar infraestructura.
## Fuente de Datos

La información nutricional de los alimentos se obtiene mediante consultas a la API pública de OpenFoodFacts (`world.openfoodfacts.org`). Esta base de datos colaborativa contiene información nutricional de miles de productos alimenticios de todo el mundo.

## Privacidad

Todos los datos del usuario (condiciones de salud, alimentos registrados, historial diario) se almacenan exclusivamente en el navegador local mediante LocalStorage. No se transmite ni se almacena ninguna información personal en servidores externos, garantizando la privacidad completa de los datos del usuario.

## Licencia

Este proyecto es una replica con fines educativos de la aplicación original FoodCheck del proyecto Saturdays.AI. El código desarrollado está disponible bajo licencia MIT.
