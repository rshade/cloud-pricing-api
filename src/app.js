const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const pinoHttp = require('pino-http');
const config = require('./config');
const apolloLogger = require('./utils/apolloLogger');
const resolvers = require('./resolvers');
const typeDefs = require('./typeDefs');

function createApp(opts = {}) {
  const app = express();

  if (!opts.disableRequestLogging) {
    app.use(pinoHttp({
      logger: config.logger,
      customLogLevel(res, err) {
        if (err || res.statusCode === 500) {
          return 'error';
        }
        return 'info';
      },
    }));
  }

  app.use(express.json());
  app.use((err, _req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400) {
      res.status(400).send({ error: 'Bad request' });
    } else {
      next();
    }
  });

  const apolloConfig = {
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    plugins: [
      apolloLogger,
    ],
    ...opts.apolloConfigOverrides,
  };

  const apollo = new ApolloServer(apolloConfig);

  apollo.applyMiddleware({ app });

  return app;
}

module.exports = createApp;
