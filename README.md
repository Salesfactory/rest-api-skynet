# Rest API Skynet

Welcome to the Rest API Skynet project! This repository contains a Node.js-based REST API for Skynet. This guide will walk you through the steps to install and run the project, including how to use Docker to containerize the application.

## Installation

To install and run the Rest API Skynet project, please follow these steps:

1. Clone the repository to your local machine using the following command:

    ```
    git clone https://github.com/Salesfactory/rest-api-skynet.git
    ```

2. Navigate to the project directory:

    ```
    cd rest-api-skynet
    ```

3. Install the project dependencies by running the following command:
    ```
    npm install
    ```

## Running the Project

The project provides multiple scripts in the `package.json` file to facilitate running and testing the application. Choose the appropriate script based on your requirements.

-   **Starting the API in Development Mode:**

    ```
    npm run dev
    ```

    This command uses `nodemon` to run the application in development mode. It automatically restarts the server whenever a file is modified, making it convenient for development purposes.

-   **Starting the API in Production Mode:**

    ```
    npm run prod
    ```

    This command starts the application in production mode using the compiled version of the code located in the `dist/` directory.

-   **Building the Project:**

    ```
    npm run build
    ```

    The build script uses Webpack to bundle and optimize the application code. It generates the compiled version of the code in the `dist/` directory, which can be used for production deployment.

-   **Starting the API using Node.js:**

    ```
    npm start
    ```

    This command starts the application using Node.js without any additional development features.

-   **Running Tests:**
    ```
    npm test
    ```
    The test script executes the project's test suite using Jest. You can add your tests in the `__tests__/` directory or modify the configuration in the `jest.config.js` file.

## Docker

The Rest API Skynet project can also be run using Docker. Docker provides a containerized environment for the application, ensuring consistent behavior across different platforms.

To build and run the project using Docker, follow these steps:

1. Make sure you have Docker installed on your machine. You can download and install Docker from the official website: [https://www.docker.com](https://www.docker.com).

2. In the project directory, create a file named `Dockerfile` and copy the following content into it:

    ```
    FROM node:18

    RUN mkdir -p /usr/src/app
    WORKDIR /usr/src/app

    COPY dist/ ./dist/

    EXPOSE 5000
    CMD ["node","dist/main.js"]
    ```

3. Build the Docker image by running the following command:

    ```
    docker build -t rest-api-skynet .
    ```

    This command builds the Docker image based on the `Dockerfile` in the current directory. The `-t` flag assigns a name to the image (`rest-api-skynet` in this case).

4. Once the image is built, you can run the containerized application using the following command:
    ```
    docker run -p 5000:5000 rest-api-skynet
    ```
    The `-p` flag maps the container's port 5000 to the host machine's port 5000, allowing access to the API.

Congratulations! You now have the Rest API Skynet project installed, running, and containerized with Docker. Feel free to explore and modify the code to suit your needs. If you encounter any issues or have questions, please submit them on the GitHub repository's issue tracker: [https://github.com/Salesfactory/rest-api-skynet/issues](https://github.com/Salesfactory/rest-api-skynet/issues).

## Email

To send emails, you need to set up the environment variables in the .env file (there's an .env.example already created)

EMAIL_USER=''
EMAIL_PASS=''

Are the credentials for the email account that will be used to send the emails.

Please refer to the following link to know how to set up the email account to be used:

[https://miracleio.me/snippets/use-gmail-with-nodemailer](https://miracleio.me/snippets/use-gmail-with-nodemailer)

## Database

You need to install PostgreSQL, refer to: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

### Database Configuration

Please use the following commands to set up the database and tables:

npx sequelize-cli db:create (to create the DB)
npx sequelize-cli db:drop (to delete the DB)
npx sequelize-cli db:migrate (to migrate the data into the DB)
npx sequelize-cli db:migrate:undo:all (removes all entries and tables)
npx sequelize-cli db:seed:all (applies all seeds)

**don't forget to set up the environment variables in the .env file (there's an .env.example already created)**

## BigQuery

Some endpoints might need BigQuery to be configured, please follow the steps below:

The basic steps are:

1.  [Select or create a Cloud Platform project](https://console.cloud.google.com/project).
2.  [Enable the Google BigQuery API](https://console.cloud.google.com/flows/enableapi?apiid=bigquery.googleapis.com).
3.  [Set up authentication with a service account](https://cloud.google.com/docs/authentication/getting-started) so you can access the
    API from your local workstation.

**Production and Development Default Credentials are different, please read carefully.**

If you need more information, please read:
[BigQuery Quickstart](https://github.com/googleapis/nodejs-bigquery#before-you-begin)

## AWS Secrets

To run the project and create campaigns you need to configure AWS secrets

1. Install AWS CLI
2. Run aws configure
3. Fill the required fields, ask a team member for the Acces Key ID and Secret Access Key
   AWS Access Key ID [None]:
   AWS Secret Access Key [None]:
   Default region name [None]: us-east-2
   Default output format [None]: json

## Contributing

If you would like to contribute to the Rest API Skynet project, you can follow these guidelines:

1. Fork the repository on GitHub.
2. Create a new branch for your feature or bug fix.
3. Make the necessary changes in your branch.
4. Run the tests to ensure they pass.
5. Commit your changes and push them to your fork.
6. Submit a pull request to the main repository.

Please make sure to follow the project's code style and include appropriate tests for your changes. Your contributions are greatly appreciated!
