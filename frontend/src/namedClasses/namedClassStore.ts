import { writable } from "svelte/store";
import type { ElementStylesByState } from "$properties/element-styles.svelte";

export type NamedClassState = {
  activeClass: string | null;
  classes: string[];
};

export const namedClassStore = writable<NamedClassState>({
  activeClass: null,
  classes: [],
});

export function setNamedClasses(classes: string[]): void {
  namedClassStore.update((state) => ({
    ...state,
    classes: [...new Set(classes)].sort(),
  }));
}

export function addNamedClass(className: string): void {
  namedClassStore.update((state) => ({
    activeClass: className,
    classes: [...new Set([...state.classes, className])].sort(),
  }));
}

export function selectNamedClass(className: string | null): void {
  namedClassStore.update((state) => ({ ...state, activeClass: className }));
}

export function emptyNamedClassStyles(): ElementStylesByState {
  return {
    default: {},
    hover: {},
    focus: {},
    active: {},
    visited: {},
  };
}
