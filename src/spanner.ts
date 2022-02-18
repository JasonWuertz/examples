import {Config, CloudFunctionCache} from './index';
type InventoryUpdateData = any;

async function StoreInventoryUpdate(
  env: Config,
  cache: CloudFunctionCache,
  product: InventoryUpdateData
): Promise<void> {
  return Promise.resolve();
}

export {StoreInventoryUpdate};
