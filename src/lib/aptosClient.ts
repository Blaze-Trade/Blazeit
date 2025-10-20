import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { APTOS_FULLNODE_URL, getAptosNetwork } from "./constants";

// Aptos client singleton
let aptosSingleton: Aptos | null = null;

export function aptosClient(): Aptos {
  if (aptosSingleton) return aptosSingleton;

  const config = new AptosConfig({
    network: getAptosNetwork(), // Use environment-based network configuration
    fullnode: APTOS_FULLNODE_URL,
  });

  aptosSingleton = new Aptos(config);
  return aptosSingleton;
}
