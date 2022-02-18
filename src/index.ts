import type {HttpFunction} from '@google-cloud/functions-framework/build/src/functions';
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
import {SecretManagerServiceClient as SecretManagerServiceClientType} from '@google-cloud/secret-manager';
import {AxiosResponse} from 'axios';
import axios from 'axios';
import * as _ from 'lodash';

import {StoreInventoryUpdate} from './spanner';

// Load in the .env file for local development
// eslint-disable-next-line node/no-unpublished-require
require('dotenv').config();

// CloudFunctionCache is a cache of objects or instances that should be reused between
// invokations of the function. This will increase performance by reducing the amount of setup
// a function has to do when called.
export type CloudFunctionCache = {
  SecretManagerInstance: SecretManagerServiceClientType | null;
};

const cloudFunctionCache: CloudFunctionCache = {
  SecretManagerInstance: null,
};

/** CONVICTIONAL API RESPONSE TYPES */
// Has the fields of a Convictional API return types
// that are relevant for this project. Not exhaustive of all fields.
// Taken from https://developers.convictional.com/reference/getproductbyid
type ConvictionalVariant = {
  id: string;
  sku: string;
  title: string;
  inventoryAmount: number;
  retailPrice: number;
  basePrice: number;
};

type ConvictionalProduct = {
  id: string;
  title: string;
  description: string;
  updated: string;
  variants: ConvictionalVariant[];
};

type ConvictionalAPIResponse<T> = {
  hasMore: boolean;
  next: string;
  previous: string;
  data: T[];
};
/** END CONVICTIONAL API RESPONSE TYPES */

// Config represents the configuration fields this
// function requires and expects
export type Config = {
  CV_API_KEY: string;
  CV_HOST: string;
};

// Main HTTP cloud function that is executed on HTTP trigger
// This function will get all products, loop through them, and update the inventory
// stored in the firestore
export const main: HttpFunction = async (req, res) => {
  const env = await loadEnvFromSecretManager();
  getProducts(env, _.defaults(req.query.page, 0)).then(
    (products: ConvictionalProduct[]) => {
      console.log(_.size(products), `products retrieved from ${env.CV_HOST}`);
      // Create a list of 'parallel' requests to firestore to check and update inventory
      const dbPromises = _.chain(products)
        .map(product =>
          _.map(product.variants, variant => ({
            ...product,
            variants: variant,
          }))
        )
        .flatten()
        .map(product => {
          return StoreInventoryUpdate(env, cloudFunctionCache, product);
        })
        .value();
      // wait for all db promises to resolve before returning
      return Promise.all(dbPromises)
        .then(() => res.send('OK'))
        .catch(e => res.status(500).send(e));
    }
  );
};

// getProducts from the Convictional API
// @param Config is the Configuration for the function that contains host URL and API Keys
function getProducts(
  env: Config,
  page: number
): Promise<ConvictionalProduct[]> {
  return axios({
    method: 'get',
    baseURL: env.CV_HOST,
    url: 'buyer/products',
    params: {
      page: page,
    },
    headers: {
      Authorization: env.CV_API_KEY,
    },
  }).then(
    (
      productsResponse: AxiosResponse<
        ConvictionalAPIResponse<ConvictionalProduct>
      >
    ) => {
      // if theres more then recurse to get the next page
      if (productsResponse.data.hasMore) {
        return getProducts(env, page++).then(
          // and merge the results
          (moreProducts: ConvictionalProduct[]) => [
            ...moreProducts,
            ...productsResponse.data.data,
          ]
        );
      }
      return productsResponse.data.data;
    }
  );
}

// loadEnvFromSecretManager will connect to the GCP secret manager to load function configuration.
// We're using this to prevent us from having to redeploy the function for configuration changes.
// This supports a fast development process and allows integration into Doppler.
// The downside of structuring configuration this way is that secrets aren't versioned individually.
async function loadEnvFromSecretManager(): Promise<Config> {
  // check if we've inited the secret manager client before
  if (!cloudFunctionCache.SecretManagerInstance) {
    // try initializing the client
    try {
      cloudFunctionCache.SecretManagerInstance =
        new SecretManagerServiceClient();
    } catch (e) {
      console.error(e);
      return Promise.reject(e);
    }
    // and recurse
    return loadEnvFromSecretManager();
  } else {
    // if it's loaded then try to access the configuration secret using the environment variable that points to it
    const [secret] =
      await cloudFunctionCache.SecretManagerInstance.accessSecretVersion({
        name: process.env['ENV_SECRET_PATH'],
      });
    // parse the configuration and load it as JSON
    return _.chain(secret)
      .get('payload.data')
      .thru(data => data.toString('utf8'))
      .thru(data => JSON.parse(data))
      .value();
  }
}
