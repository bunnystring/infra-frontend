# Infra Frontend

**infra-frontend** is the main frontend application for the Infra* microservices ecosystem.

Built with [Angular 19](https://angular.io/) and [Node.js 20.x LTS](https://nodejs.org/), it provides a modern, responsive, and user-friendly interface for interacting with the Infra* backend microservices. This application enables management of devices, users, and other resources within the Infra* platform.

## Features

- Responsive web interface built with Angular 19
- Integration with Infra* backend microservices via REST APIs
- Centralized authentication and authorization
- Real-time updates and dynamic data visualization
- Modular architecture for scalability and maintainability

## Prerequisites

- [Node.js](https://nodejs.org/) **version 20.x LTS (obligatorio, no uses versiones impares ni superiores)**
- [Angular CLI](https://angular.io/cli) **versión 19.x**
    ```sh
    npm install -g @angular/cli@19
    ```
- [npm](https://www.npmjs.com/) (incluido con Node.js)

## Getting Started

1. **Clona el repositorio:**
   ```sh
   git clone https://github.com/bunnystring/infra-frontend.git
   cd infra-frontend
   ```

2. **Instala las dependencias:**
   ```sh
   npm install
   ```

3. **Ejecuta el servidor de desarrollo:**
   ```sh
   ng serve
   ```
   La aplicación estará disponible en [http://localhost:4200](http://localhost:4200).

## Project Structure

```
infra-frontend/
├── src/
│   ├── app/               # Angular application source code
│   ├── assets/            # Static assets (images, icons, etc.)
│   └── environments/      # Environment-specific configurations
├── angular.json           # Angular project configuration
├── package.json           # NPM scripts and dependencies
└── README.md              # Project documentation
```

## Environment Configuration

Environment variables can be set in the `src/environments/` folder.  
For example, update `environment.ts` and `environment.prod.ts` to point to the correct backend API URLs.

## Build

Para compilar el proyecto para producción:

```sh
ng build --configuration production
```
O bien, si necesitas especificar la carpeta de salida:
```sh
npm run build -- --output-path=dist
```

El resultado estará en el directorio `dist/`.

## Notas y errores comunes

- Si ves el error:
    ```
    Could not find the '@angular-devkit/build-angular:application' builder's node package.
    ```
  Asegúrate de usar Node.js 20.x, haber corrido `npm install` y tener Angular CLI 19.

- Si falta algún archivo de estilos (por ejemplo, `src/styles.css` o `src/app/app.component.css`), créalos vacíos para evitar errores de compilación.

## Contributing

Feel free to open issues or submit pull requests for improvements and bug fixes!

## License

This project is part of the Infra* family of microservices and applications.  
Only educative
