const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
// const { GraphQLPlaygroundApp } = require('@keystonejs/app-graphql-playground');
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
// const { NextApp } = require('@keystonejs/app-next');
const { StaticApp } = require('@keystonejs/app-static');
const initialiseData = require('./initial-data');
const models = require('./models')

const prod = process.env.NODE_ENV === 'production'

const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose');

const PROJECT_NAME = 'inw-site';
const adapterConfig = { mongoUri: 'mongodb+srv://kevin:kevinmongo@cluster0.bru7j.gcp.mongodb.net/<dbname>?retryWrites=true&w=majority' };

const keystone = new Keystone({
  name: PROJECT_NAME,
  adapter: new Adapter(adapterConfig),
  cookieSecret: prod ? 'inw-prod' : 'inw-dev',
  onConnect: process.env.CREATE_TABLES !== 'true' && initialiseData,
});

Object.keys(models).map(key => {
  keystone.createList(key, models[key])
})

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
});

const apiPath = '/admin/api';

module.exports = {
  keystone,
  apps: [
    // new GraphQLPlaygroundApp({ apiPath }),
    // new GraphQLApp({ apiPath, graphiqlPath: undefined }),
    new GraphQLApp(),
    new AdminUIApp({
      enableDefaultRoute: false,
      authStrategy,
    }),
    // new NextApp({ dir: 'app' }),
    new StaticApp({
      path: '/',
      src: 'public',
    }),
  ],
};
