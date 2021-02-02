import * as React from 'react';
import { useState as useReactState, Renderer, ReactNode, ReactNodeArray, Context, Component, ComponentType } from 'react'

export declare type GetProps<C> = C extends ComponentType<infer P> ? P : never;

type HOC = <C extends ComponentType<GetProps<C>>>(component: C): C

export const render: Renderer;
export const store: any;
export const useState: typeof useReactState;
export const getInitialProps: (fetch: Promise<any>, fallback: ReactNode | ReactNodeArray | (props: any) => ReactNode | ReactNodeArray) => HOC;
export const ready: (delayMillisecond?: number) => Promise<void>
export const withSanti: HOC
export const useNodeKey: () => ({
  nodeKey: string,
  getCountedKey: () => string | undefined
})
export const useSID: () => ({
  sid: string,
  getCountedSID: () => string | undefined
})
export const Ready: {
  (): React.JSXElement;
  OnMount: (): React.JSXElement;
}

export function NoSSR(): React.JSXElement;

export default {
  render,
  store,
  useState,
  getInitialProps,
  ready,
  withSanti,
  useNodeKey,
  useSID,
  Ready,
  NoSSR
}
