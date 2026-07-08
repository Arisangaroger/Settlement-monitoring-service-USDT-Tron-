export interface TronLinkRequestResult {
  code: number;
  message?: string;
}

export interface TronWebDefaultAddress {
  /** TronWeb uses `false` when no account is selected. */
  base58: string | false;
  hex?: string | false;
}

export interface TronWebInstance {
  ready?: boolean;
  defaultAddress?: TronWebDefaultAddress;
}

export interface TronLinkInstance {
  ready?: boolean;
  request: (args: { method: string; params?: unknown }) => Promise<TronLinkRequestResult>;
}

interface TronProvider {
  isTronLink?: boolean;
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  tronWeb?: TronWebInstance | false;
}

declare global {
  interface Window {
    tron?: TronProvider;
    tronLink?: TronLinkInstance;
    tronWeb?: TronWebInstance;
  }
}

const SESSION_LINKED_KEY = 'tronlink-session-linked';
const SESSION_ADDRESS_KEY = 'tronlink-connected-address';

export class TronLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TronLinkError';
  }
}

function normalizeAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const address = value.trim();
  return address || null;
}

function readTronWebAddress(): string | null {
  const fromGlobal = normalizeAddress(window.tronWeb?.defaultAddress?.base58);
  if (fromGlobal) return fromGlobal;

  const providerTronWeb = window.tron?.tronWeb;
  if (providerTronWeb && providerTronWeb !== false) {
    return normalizeAddress(providerTronWeb.defaultAddress?.base58);
  }

  return null;
}

function getTronProvider(): TronProvider | null {
  if (window.tron?.request) return window.tron;
  if (window.tronLink?.request) {
    return window.tronLink as unknown as TronProvider;
  }
  return null;
}

function parseAccountsResponse(value: unknown): string | null {
  if (Array.isArray(value)) {
    return normalizeAddress(value[0]);
  }
  return normalizeAddress(value);
}

async function waitForTronLinkReady(timeoutMs = 4000): Promise<void> {
  if (readTronWebAddress()) return;
  if (window.tronLink?.ready) return;

  await new Promise<void>((resolve) => {
    const done = () => resolve();
    const timer = window.setTimeout(done, timeoutMs);
    window.addEventListener('tronLink#initialized', () => {
      window.clearTimeout(timer);
      done();
    }, { once: true });
  });
}

async function waitForTronWebAddress(timeoutMs = 3000): Promise<string | null> {
  await waitForTronLinkReady(Math.min(timeoutMs, 4000));

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const address = readTronWebAddress();
    if (address) return address;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return readTronWebAddress();
}

async function requestTronAccounts(): Promise<string | null> {
  const provider = getTronProvider();
  if (!provider?.request) return null;

  try {
    const modern = await provider.request({ method: 'eth_requestAccounts' });
    const fromModern = parseAccountsResponse(modern);
    if (fromModern) return fromModern;
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : null;
    if (message && !message.toLowerCase().includes('reject')) {
      // Non-rejection errors may still work via legacy request below.
    }
  }

  if (window.tronLink?.request) {
    const legacy = await window.tronLink.request({
      method: 'tron_requestAccounts',
      params: {
        websiteName: 'Stablecoin Settlement Monitor',
      },
    });

    if (legacy.code === 4001) {
      throw new TronLinkError('TronLink connection was rejected. Approve the site in TronLink and try again.');
    }

    if (legacy.code !== 200) {
      throw new TronLinkError(
        legacy.message ?? 'TronLink connection failed. Unlock TronLink and approve this website.',
      );
    }
  }

  return waitForTronWebAddress();
}

/** Mark this browser tab as connected to TronLink for the session. */
export function markTronLinkSessionLinked(address: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_LINKED_KEY, '1');
  sessionStorage.setItem(SESSION_ADDRESS_KEY, address);
}

export function getStoredTronLinkAddress(): string | null {
  if (typeof window === 'undefined' || !hasTronLinkSession()) return null;
  return normalizeAddress(sessionStorage.getItem(SESSION_ADDRESS_KEY));
}

export function hasTronLinkSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_LINKED_KEY) === '1';
}

export function clearTronLinkSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_LINKED_KEY);
  sessionStorage.removeItem(SESSION_ADDRESS_KEY);
}

/** Clear the app-side TronLink connection so the user can connect again. */
export function disconnectTronLink(): void {
  clearTronLinkSession();
}

export interface ResolveTronLinkAddressOptions {
  /** Prompt TronLink authorization/unlock if passive read fails. */
  authorize?: boolean;
}

/**
 * Resolve the currently selected TronLink address.
 * Pass `{ authorize: true }` to open TronLink when the wallet is locked or the site is not approved.
 */
export async function resolveTronLinkAddress(
  options: ResolveTronLinkAddressOptions = {},
): Promise<string | null> {
  if (typeof window === 'undefined' || !isTronLinkInstalled()) return null;

  const passive = await waitForTronWebAddress(2000);
  if (passive) return passive;
  if (!options.authorize) return null;

  return requestTronAccounts();
}

/** Connect TronLink and return the currently selected base58 address. */
export async function connectTronLink(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new TronLinkError('TronLink is only available in the browser');
  }

  if (!isTronLinkInstalled()) {
    throw new TronLinkError(
      'TronLink extension not found. Install TronLink and refresh this page.',
    );
  }

  const address = await requestTronAccounts();
  if (!address) {
    throw new TronLinkError(
      'No TronLink account is available. Unlock TronLink, select an account, approve this site, then try again.',
    );
  }

  markTronLinkSessionLinked(address);
  return address;
}

/** Read the address TronLink currently has selected without opening a popup. */
export async function readCurrentTronLinkAddress(): Promise<string | null> {
  return resolveTronLinkAddress({ authorize: false });
}

/** @deprecated Use readCurrentTronLinkAddress after an explicit connect. */
export function getConnectedTronAddress(): string | null {
  if (typeof window === 'undefined' || !hasTronLinkSession()) return null;
  return readTronWebAddress();
}

export function isTronLinkInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.tronLink || window.tron);
}

export type TronAccountChangeHandler = (address: string | null) => void;

function extractAddressFromAccountEvent(args: unknown[]): string | null {
  const first = args[0];

  if (typeof first === 'string') {
    return normalizeAddress(first);
  }

  if (Array.isArray(first)) {
    return normalizeAddress(first[0]);
  }

  if (first && typeof first === 'object' && 'address' in first) {
    return normalizeAddress((first as { address?: unknown }).address);
  }

  return null;
}

/** Listen for account switches inside the TronLink extension. */
export function subscribeToTronLinkAccountChanges(
  handler: TronAccountChangeHandler,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const cleanups: Array<() => void> = [];

  const emitLatest = async (hint?: string | null) => {
    if (hint) {
      handler(hint);
      return;
    }
    handler(await readCurrentTronLinkAddress());
  };

  if (window.tron?.on) {
    const onAccountsChanged = (...args: unknown[]) => {
      void emitLatest(extractAddressFromAccountEvent(args));
    };
    window.tron.on('accountsChanged', onAccountsChanged);
    cleanups.push(() => window.tron?.removeListener?.('accountsChanged', onAccountsChanged));
  }

  const onMessage = (event: MessageEvent) => {
    const message = event.data?.message;
    if (!message?.action) return;

    if (message.action === 'accountsChanged' || message.action === 'setAccount') {
      void emitLatest(normalizeAddress(message.data?.address));
      return;
    }

    if (message.action === 'disconnectWeb' || message.action === 'disconnect') {
      clearTronLinkSession();
      handler(null);
    }
  };

  window.addEventListener('message', onMessage);
  cleanups.push(() => window.removeEventListener('message', onMessage));

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
