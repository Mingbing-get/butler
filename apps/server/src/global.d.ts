import { InJwtUser } from './type';

export declare module 'Koa' {
  export interface DefaultState {
    user: InJwtUser;
  }
}

export declare module '@ai-nucl/server-ai' {
  export namespace AiNucl {
    export namespace AiService {
      export interface Context {
        user: InJwtUser;
      }
    }
  }
}
