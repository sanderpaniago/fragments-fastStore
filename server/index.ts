/* eslint-disable react-hooks/rules-of-hooks */
import {
  envelop,
  useExtendContext,
  useMaskedErrors,
  useSchema,
} from "@envelop/core";
import { useGraphQlJit } from "@envelop/graphql-jit";
import { useParserCache } from "@envelop/parser-cache";
import { useValidationCache } from "@envelop/validation-cache";
import {
  getContextFactory as getContextFactoryVtex,
  getSchema as getSchemaVtex,
} from "@faststore/api";
import { makeExecutableSchema, mergeSchemas } from "@graphql-tools/schema";
import { GraphQLError } from "graphql";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";

import persisted from "../../@generated/graphql/persisted.json";
import storeConfig from "../../store.config";

const typesArray = loadFilesSync("./src/server", {
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

const getSchema = getSchemaVtex(apiOptions as any);

const getContextFac = getContextFactoryVtex(apiOptions as any);

export const getContextFactory = () => getContextFac;

const resolvers = {
  // ...your resolvers
};

export const getMergedSchema = async () => {
  return mergeSchemas({
    schemas: [await getSchema, makeExecutableSchema({ typeDefs, resolvers })],
  });
};

const isBadRequestError = (err: any) => {
  return err.originalError && err.originalError.name === "BadRequestError";
};

const formatError = (err: any) => {
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
      useExtendContext(getContextFac),
      useMaskedErrors({ formatError }),
      useGraphQlJit(),
      useValidationCache(),
      useParserCache(),
    ],
  });

const envelopPromise = getEnvelop();

export const execute = async (options: any, envelopContext = {}) => {
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
