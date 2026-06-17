import type { InventoryDO } from "../durableObject/inventory"
import type { Env } from "../types"

export const INVENTORY_DO_NAME = "onyx-inventory"

export function getInventoryStub(env: Env) {
	const id = env.INVENTORY.idFromName(INVENTORY_DO_NAME)
	return env.INVENTORY.get(id) as unknown as DurableObjectStub<InventoryDO>
}
