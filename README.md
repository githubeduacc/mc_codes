# Generador de códigos de descuento para Mc Donald's

Generá códigos de 20%, 30%, 50% y 70% de descuento para utilizar desde la app de Mc Donald's de lunes a jueves hasta el 25 de enero del 2025. TyC: https://www.mcdonalds.com.ar/bases-y-condicones-promocion-ruletapp.

Requisitos previos:

- Instalar NodeJS: https://nodejs.org.

## Instalación y configuración

Se da por hecho que el código ya se encuentra descargado y que todos los comandos y acciones se realizarán dentro de la carpeta del mismo.

1 - Instalar dependencias:

```bash
  npm install
```

2 - Renombrar archivo `.env.example` a `.env`.

3 (opcional) - En caso de querer activar el servicio de notificaciones mediante email se deberá configurar el archivo `.env` con los campos `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_HOST`, `SENDER_ADDRESS`, y `RECEIVER_ADDRESS` según corresponda. Además se deberá cambiar el campo `EMAILS_ENABLED` de `false` a `true`.

## Inicialización

Para inicializar el programa ejecutá el siguiente comando:

```bash
  npm run start
```

En caso de querer inicializarlo en modo de desarrollo para depurar posibles errores, puedes hacerlo con este otro comando:

```bash
  npm run dev
```

## Disclaimer

Este proyecto no está afiliado, respaldado ni patrocinado por Mc Donald´s. Todos los derechos asociados a la marca y su uso están reservados a su propietario legítimo. El uso de la marca en este sitio es únicamente informativo y exclusivamente con propósitos educativos. No nos hacemos responsable de cualquier uso indebido que pueda hacerse del proyecto.
