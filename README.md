# spawn-express-app

A simple ExpressJS skeleton generator with zero dependency and customizable arguments

## Install

Run `npm install -g spawn-express-app`

## How to use

Run `npx spawn-express-app <DIRECTORY-NAME> [OPTIONS]`

## Example

`npx spawn-express-app my-backend -e -n -d=postgres` <br>
This will generate a express app called `my-backend` with environment variables, nodemon and postgres already setup for your use.

## Options

| Option      | Description                                    |
| ----------- | ---------------------------------------------- |
| -e          | Add 'dotenv' environment variable support      |
| -n          | Add nodemon for development                    |
| -v=[OPTION] | Add view engine (pug, ejs, mustache, nunjucks) |
| -c=[OPTION] | Add CSS support (sass, css)                    |
| -d=[OPTION] | Integrate with a database (postgres)           |

## Queries

For any queries you can email at: khapungbj84@gmail.com
