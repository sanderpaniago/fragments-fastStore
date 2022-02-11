/* eslint-disable react-hooks/rules-of-hooks */
/* eslint import/no-nodejs-modules: ["error", {"allow": ["path"]}] */
/* eslint import/order: ["error", {"warnOnUnassignedImports": true}] */
const path = require("path");
const {
  envelop,
  useExtendContext,
  useMaskedErrors,
  useSchema,
} = require("@envelop/core");
const { useGraphQlJit } = require("@envelop/graphql-jit");
const { useParserCache } = require("@envelop/parser-cache");
const { useValidationCache } = require("@envelop/validation-cache");
const { getContextFactory, getSchema } = require("@faststore/api");
const { makeExecutableSchema, mergeSchemas } = require("@graphql-tools/schema");
const { GraphQLError } = require("graphql");
const { loadFilesSync } = require("@graphql-tools/load-files");
const { mergeTypeDefs } = require("@graphql-tools/merge");

const persisted = require("../../@generated/graphql/persisted.json");
const storeConfig = require("../../store.config");
const getDataProduct = require("./resolvers/items");
const getRating = require("./resolvers/getRating");
const getTranslateReview = require("./resolvers/getTranslatedReview");
const postReviewVote = require("./resolvers/postReviewVote");
const shipping = require("./resolvers/shipping");

const typesArray = loadFilesSync(path.join(__dirname, "."), {
  extensions: ["gql"],
});

const typeDefs = mergeTypeDefs(typesArray);

const persistedQueries = new Map(Object.entries(persisted));

const apiOptions = {
  platform: storeConfig.platform,
  account: storeConfig.api.storeId,
  environment: storeConfig.api.environment,
  channel: storeConfig.channel,
};

const apiSchema = getSchema(apiOptions);
const apiContextFactory = getContextFactory(apiOptions);

const resolvers = {
  // .... your resolvers
};

const getMergedSchema = async () => {
  return mergeSchemas({
    schemas: [await apiSchema, makeExecutableSchema({ typeDefs, resolvers })],
  });
};

const isBadRequestError = (err) => {
  return err.originalError && err.originalError.name === "BadRequestError";
};

const formatError = (err) => {
  console.error(err);

  if (err instanceof GraphQLError && isBadRequestError(err)) {
    return err;
  }

  return new GraphQLError("Sorry, something went wrong.");
};

const getEnvelop = async () =>
  envelop({
    plugins: [
      useSchema(await getMergedSchema()),
      useExtendContext(apiContextFactory),
      useMaskedErrors({ formatError }),
      useGraphQlJit(),
      useValidationCache(),
      useParserCache(),
    ],
  });

const envelopPromise = getEnvelop();

const execute = async (options, envelopContext = {}) => {
  const { operationName, variables, query: maybeQuery } = options;
  const query = maybeQuery || persistedQueries.get(operationName);

  if (query == null) {
    throw new Error(`No query found for operationName: ${operationName}`);
  }

  const enveloped = await envelopPromise;
  const {
    parse,
    contextFactory,
    execute: run,
    schema,
  } = enveloped(envelopContext);

  return run({
    schema,
    document: parse(query),
    variableValues: variables,
    contextValue: await contextFactory({}),
    operationName,
  });
};

module.exports = {
  execute,
  getSchema: () => apiSchema,
  getContextFactory: () => apiContextFactory,
  getMergedSchema,
};
