import type { PaymentDO } from "../durableObject/payment"
import type { Env } from "../types"

export function getPaymentStub(env: Env, mailboxId: string) {
	const id = env.PAYMENT.idFromName(mailboxId)
	return env.PAYMENT.get(id) as unknown as DurableObjectStub<PaymentDO>
}
