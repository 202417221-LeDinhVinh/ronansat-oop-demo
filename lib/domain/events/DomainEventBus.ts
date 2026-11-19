import { EventHandler } from "./DomainEvents";

/**
 * Ch.11 typed in-process Observer (publish/subscribe) bus.
 *
 * `TEvents` is the event map, so `subscribe("AttemptSubmitted", handler)` only accepts a handler
 * whose payload is exactly `AttemptSubmittedEvent`. `publish` awaits every subscriber, which
 * keeps the HTTP response consistent with the old inline behaviour: side effects finish before
 * the controller returns.
 */
export class DomainEventBus<TEvents extends object> {
    private readonly handlers = new Map<keyof TEvents, EventHandler<unknown>[]>();

    public subscribe<K extends keyof TEvents>(type: K, handler: EventHandler<TEvents[K]>): void {
        const registered = this.handlers.get(type) ?? [];
        registered.push(handler as EventHandler<unknown>);
        this.handlers.set(type, registered);
    }

    public async publish<K extends keyof TEvents>(type: K, event: TEvents[K]): Promise<void> {
        const registered = this.handlers.get(type) ?? [];
        for (const handler of registered) {
            await handler.handle(event as unknown);
        }
    }
}
