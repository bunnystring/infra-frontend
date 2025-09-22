# infra-angular-frontend

**infra-angular-frontend** is the main frontend application for the Infra* microservices ecosystem.

Built with [Angular](https://angular.io/), it provides a modern, responsive, and user-friendly interface for interacting with the Infra* backend microservices. This application enables management of devices, users, and other resources within the Infra* platform.

## Features

- Responsive web interface built with Angular
- Integration with Infra* backend microservices via REST APIs
- Centralized authentication and authorization
- Real-time updates and dynamic data visualization
- Modular architecture for scalability and maintainability

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- [Angular CLI](https://angular.io/cli) (version 16.x or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/bunnystring/infra-angular-frontend.git
   cd infra-angular-frontend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Run the development server:**
   ```sh
   ng serve
   ```
   The application will be available at [http://localhost:4200](http://localhost:4200).

## Project Structure

```
infra-angular-frontend/
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

To build the project for production, run:

```sh
ng build --configuration production
```

The output will be in the `dist/` directory.

## Contributing

Feel free to open issues or submit pull requests for improvements and bug fixes!

## License

This project is part of the Infra* family of microservices and applications.  
Only educative
