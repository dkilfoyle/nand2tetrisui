import { useEffect, useMemo } from "react";

import { Clock } from "@nand2tetris/web-ide/simulator/src/chip/clock";

export function useClock(actions: { tick?: () => void; toggle?: () => void; reset?: () => void }) {
  const clock = useMemo(() => Clock.get(), []);

  useEffect(() => {
    const subscription = clock.$.subscribe(() => {
      actions.tick?.();
    });
    return () => subscription.unsubscribe();
  }, [actions, clock.$]);

  return {
    toggle() {
      clock.tick();
      actions.toggle?.();
    },

    reset() {
      clock.reset();
      actions.reset?.();
    },
  };
}

export function useClockFrame(frameFinished: () => void) {
  useEffect(() => {
    const subscription = Clock.get().frame$.subscribe(() => {
      frameFinished();
    });
    return () => subscription.unsubscribe();
  }, [frameFinished]);
}

export function useClockReset(reset: () => void) {
  useEffect(() => {
    const subscription = Clock.get().reset$.subscribe(() => {
      reset();
    });
    return () => subscription.unsubscribe();
  }, [reset]);
}
