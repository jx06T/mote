import app from '../../worker/src/index';

interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
}

export const onRequest = async (context: EventContext<any, any, any>): Promise<Response> => {
  return app.fetch(context.request, context.env, context as unknown as ExecutionContext);
};
