import type {
  ViewModelInstance,
  ViewModelInstanceBoolean,
  ViewModelInstanceEnum,
  ViewModelInstanceNumber,
  ViewModelInstanceString,
} from '@rive-app/react-canvas';

/**
 * A thin, cached, name-addressed facade over a Rive ViewModelInstance.
 *
 * Rive's `vmi.number('learnWindowX')` allocates a wrapper on every call, so anything
 * driven by a ResizeObserver would churn objects at layout rate. The binder
 * resolves each property once, keeps it, and drops redundant writes.
 *
 * It is deliberately untyped w.r.t. property names: any property that exists
 * in the ViewModel is reachable, so adding inputs in Rive needs no code here.
 */
export class VyomBinder {
  private numbers = new Map<string, ViewModelInstanceNumber | null>();
  private booleans = new Map<string, ViewModelInstanceBoolean | null>();
  private strings = new Map<string, ViewModelInstanceString | null>();
  private enums = new Map<string, ViewModelInstanceEnum | null>();
  private lastNumber = new Map<string, number>();

  private readonly vmi: ViewModelInstance;

  constructor(vmi: ViewModelInstance) {
    this.vmi = vmi;
  }

  private resolve<T>(cache: Map<string, T | null>, name: string, lookup: () => T | null): T | null {
    if (!cache.has(name)) cache.set(name, lookup());
    return cache.get(name) ?? null;
  }

  number(name: string) {
    return this.resolve(this.numbers, name, () => this.vmi.number(name));
  }

  boolean(name: string) {
    return this.resolve(this.booleans, name, () => this.vmi.boolean(name));
  }

  /**
   * Triggers are resolved fresh every time, never cached.
   *
   * A held `ViewModelInstanceTrigger` stops reaching the state machine after
   * the first advance: `.trigger()` still returns cleanly, so the failure is
   * silent — the animation simply never plays. Numbers and booleans do not
   * behave this way, which is why only this lookup is uncached.
   */
  trigger(name: string) {
    return this.vmi.trigger(name);
  }

  string(name: string) {
    return this.resolve(this.strings, name, () => this.vmi.string(name));
  }

  enum(name: string) {
    return this.resolve(this.enums, name, () => this.vmi.enum(name));
  }

  /** Writes a number, skipping the call when the value is unchanged. */
  setNumber(name: string, value: number): boolean {
    if (!Number.isFinite(value)) return false;
    const rounded = Math.round(value * 100) / 100;
    if (this.lastNumber.get(name) === rounded) return true;
    const property = this.number(name);
    if (!property) return false;
    property.value = rounded;
    this.lastNumber.set(name, rounded);
    return true;
  }

  getNumber(name: string): number | null {
    return this.number(name)?.value ?? null;
  }

  setBoolean(name: string, value: boolean): boolean {
    const property = this.boolean(name);
    if (!property) return false;
    property.value = value;
    return true;
  }

  fire(name: string): boolean {
    const property = this.trigger(name);
    if (!property) return false;
    property.trigger();
    return true;
  }

  /** Forgets cached values so the next write is sent through unconditionally. */
  invalidate() {
    this.lastNumber.clear();
  }
}
