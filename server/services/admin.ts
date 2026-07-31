import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { KoaAdapter } from "@bull-board/koa";
import type Koa from "koa";
import env from "@server/env";
import {
  globalEventQueue,
  processorEventQueue,
  websocketQueue,
  taskQueue,
} from "../queues";

export default function init(app: Koa) {
  const serverAdapter = new KoaAdapter();
  createBullBoard({
    queues: [
      new BullAdapter(globalEventQueue()),
      new BullAdapter(processorEventQueue()),
      new BullAdapter(websocketQueue()),
      new BullAdapter(taskQueue()),
    ],
    serverAdapter,
  });
  serverAdapter.setBasePath(`${env.basePath}/admin`);
  app.use(serverAdapter.registerPlugin());
}
