// Lightweight stubbing helpers for node:test (no DB / Redis / socket server needed).
import { initializeSocket } from '../../src/shared/infrastructure/socket';

type Restore = () => void;
const restores: Restore[] = [];

/** Replaces obj[method] with impl until restoreAll() is called. */
export function stub<T extends object>(obj: T, method: string, impl: (...args: any[]) => any): void {
    const target = obj as any;
    const original = target[method];
    target[method] = impl;
    restores.push(() => { target[method] = original; });
}

/** Restores every stub created with stub()/spyIO(). Call it in afterEach. */
export function restoreAll(): void {
    while (restores.length) restores.pop()!();
}

/** Function that records the arguments of each call and returns impl's result. */
export function recorder<R = any>(impl: (...args: any[]) => R = (() => undefined as any)) {
    const calls: any[][] = [];
    const fn = (...args: any[]) => {
        calls.push(args);
        return impl(...args);
    };
    return Object.assign(fn, { calls });
}

export interface SocketEmit { room: string; event: string; payload: any; }

let io: any;

/** Initializes Socket.IO without an HTTP server (once) and records io.to(room).emit(...) calls. */
export function spyIO(): SocketEmit[] {
    if (!io) io = initializeSocket({ server: undefined });
    const emits: SocketEmit[] = [];
    stub(io, 'to', (room: string) => ({
        emit: (event: string, payload: any) => { emits.push({ room, event, payload }); return true; }
    }));
    return emits;
}
