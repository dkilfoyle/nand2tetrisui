import { useCallback, useRef } from "react";
import { useClockFrame, useClockReset } from "@nand2tetris/web-ide/components/src/clockface";

const WHITE = "white";
const BLACK = "black";
type COLOR = typeof WHITE | typeof BLACK;

export interface ScreenMemory {
  get(idx: number): number;
}

function get(mem: ScreenMemory, x: number, y: number): COLOR {
  const byte = mem.get(32 * y + ((x / 16) | 0));
  const bit = byte & (1 << x % 16);
  return bit === 0 ? WHITE : BLACK;
}

function set(data: Uint8ClampedArray, x: number, y: number, value: COLOR) {
  const pixel = (y * 512 + x) * 4;
  const color = value === WHITE ? 255 : 0;
  data[pixel] = color;
  data[pixel + 1] = color;
  data[pixel + 2] = color;
  data[pixel + 3] = 255;
}

function drawImage(ctx: CanvasRenderingContext2D, memory: ScreenMemory) {
  const image = ctx.getImageData(0, 0, 512, 256);
  for (let col = 0; col < 512; col++) {
    for (let row = 0; row < 256; row++) {
      const color = get(memory, col, row);
      set(image.data, col, row, color);
    }
  }
  ctx.putImageData(image, 0, 0);
}

export const Screen = ({ memory, frame }: { memory: ScreenMemory; frame: string }) => {
  const canvas = useRef<HTMLCanvasElement>();

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d") ?? undefined;
    console.log("Drawing", frame);

    if (ctx) {
      drawImage(ctx, memory);
    }
  }, [memory, frame]);

  const ctxRef = useCallback(
    (ref: HTMLCanvasElement | null) => {
      canvas.current = ref ?? undefined;
      draw();
    },
    [canvas, draw]
  );

  useClockFrame(() => {
    console.log("frame");
    draw();
  });
  useClockReset(() => {
    console.log("reset");
    // canvas.current?.getContext("2d")?.clearRect(0, 0, canvas.current.width, canvas.current.height);
  });

  return (
    <article className="panel">
      <header>Screen</header>
      <main style={{ backgroundColor: "var(--code-background-color)" }}>
        <figure
          style={{
            width: "100%",
            maxWidth: "512px",
            boxSizing: "content-box",
            marginInline: "auto",
            margin: "auto",
            borderTop: "2px solid gray",
            borderLeft: "2px solid gray",
            borderBottom: "2px solid lightgray",
            borderRight: "2px solid lightgray",
          }}>
          <canvas ref={ctxRef} width={512} height={256}></canvas>
        </figure>
      </main>
    </article>
  );
};
