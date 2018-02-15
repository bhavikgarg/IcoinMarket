## Prerequisites

* Install [node](https://nodejs.org/en/)
* Install [SASS](http://sass-lang.com/install)
* Install [MongoDB](https://docs.mongodb.org/manual/installation/)
* Install [Neo4J](http://neo4j.com/docs/stable/server-installation.html)
* Install [PM2](https://github.com/Unitech/pm2)


## Environment Variables
```
NODE_ENV           (Environment name, possible values are 'production', 'development')
PORT               (API running port)
MONGOLAB_URI       (MongoDB URL)
IP                 (IP address of API (where API is running))
NEO4J_USER         (Neo4J login user name)
NEO4J_PASS         (Neo4J login password)
NEO4J_URI          (Neo4J server path or IP address (example localhost:7474) with PORT and without protocol)
NEO4J_PROTOCOL     (Neo4J server running on which protocol (i.e. 'http://' or 'https://'))
PAYPAL_USERNAME    (PayPal Username (required for purchase (not in use now)))
PAYPAL_PASSWORD    (PayPal password (required for purchase (not in use now)))
PAYAPAL_SIGNATURE  (PayPal signature (required for purchase (not in use now)))
PAY_RETURN_URL     (PayPal return success URL (required for purchase (not in use now)))
PAY_CANCEL_URL     (PayPal return cancel URL (required for purchase (not in use now)))
```


## Development Prerequisites

* Install `yo`, `grunt-cli`, `bower`, and `generator-angular-fullstack`:

```
npm install -g node yo grunt-cli bower generator-angular-fullstack
```

## Project Structure

Overview

    ├── client
    │   ├── app                 - All of our app specific components go in here
    │   ├── assets              - Custom assets: fonts, images, etc…
    │   ├── components          - Our reusable components, non-specific to to our app
    │
    ├── e2e                     - Our protractor end to end tests
    │
    └── server
        ├── api                 - Our apps server api
        ├── auth                - For handling authentication with different auth strategies
        ├── components          - Our reusable or app-wide components
        ├── config              - Where we do the bulk of our apps configuration
        │   └── local.env.js    - Keep our environment variables out of source control
        │   └── environment     - Configuration specific to the node environment
        └── views               - Server rendered views

An example client component in `client/app`

    main
    ├── main.js                 - Routes
    ├── main.controller.js      - Controller for our main route
    ├── main.controller.spec.js - Test
    ├── main.html               - View
    └── main.less               - Styles

An example server component in `server/api`

    affiliates
    ├── index.js                     - Routes
    ├── affiliates.controller.js     - Controller for our `thing` endpoint
    ├── affiliates.model.js          - Database model
    ├── affiliates.socket.js         - Register socket events
    └── affiliates.spec.js           - Test



## Configuration Files

To update the server configurations: -

- App Port Setting,
- MongoDB Connection,
- Neo4J Connection,
- Facebook APP,
- Google+ APP,
- Products Type,
- Landing Pages,
- Payment Methods and Its APP settings,
- App Default Sponsor ID,
- App Default Sponsor Username,
- Send Email Settings,
- Others**

We have following config files (PATH: server/config/environment/): -

- index.js          - For global configuration used in all environments (development, production)
- development.js    - For development specific configuration
- production.js     - For production specific configuration


## Installation

Clone Repository:

* Login with your credentials on https://bitbucket.org/clickintensity/ci-main
* Click on "Clone" copy the repository clone path
* Run it on you machine terminal

```
Clone repository as said above
cd CLONE_REPOSITORY_PATH

git checkout develop
npm install
bower install
```

## Insert Data Primary Data (MongoDB)

- In Development Env

```
  Update "development.js" and change "seedDB" value to true
```

- In Production Env

```
  Update "production.js" and change "seedDB" value to true
```


## Insert Data in Neo4J

```
  Run following query in DB

 CREATE (ci:ICUser {id: "569764a66110ef9f6810c2ea", name: "icoincompany", sponsor: "", joinat: "2017-05-30T10:39:08.554Z", hpos: 0, ip: "", email: "noreply@icoinmarket.com", countryname: "Hong Kong", countrycode: "HK", sponsorId: "1", sponsorUsername: "admin"}) RETURN ci;
```

## For Production ENV settings

```
  Need to copy form server/config/environments/production.js
```


## Update AppPath in "dist/public/app/a664340c.app.js"

```
  Find and Replace "YOUR_API_PATH" with the APP server path including port (if necessary)

  **Note "YOUR_API_PATH" must not end with "/"
```


## Run in Production Environments

Considering you have already generated "dist" by running command "grunt build" and all Prerequisites are already installed and running on server

```
chmod 755 ./launch.sh
./launch.sh
```

## Run task

This will consider node packages are install as required for server (i.e. required package.json file found inside server folder)

```
  pm2 start crontab.js                         # Process record to generate Leaderboard data   
  pm2 start genealogy-packs-update-cronjob.js  # Update user's Gold, Silver packs information in Neo4J
  pm2 start user-cxview-crontab.js             # Clear admin area for user's backoffice view
```


## Run on development machine

* Run `grunt` for building
* Run `grunt serve` for preview
* `grunt serve:dist` for a preview of the built app.
# My project's README
