import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { APTOS_FULLNODE_URL } from "./constants";

// Aptos client singleton
let aptosSingleton: Aptos | null = null;

export function aptosClient(): Aptos {
  if (aptosSingleton) return aptosSingleton;

  const config = new AptosConfig({
    network: Network.DEVNET, // Default to devnet, can be configured via env
    fullnode: APTOS_FULLNODE_URL,
  });

  aptosSingleton = new Aptos(config);
  return aptosSingleton;
}
