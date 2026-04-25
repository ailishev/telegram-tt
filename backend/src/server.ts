import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`Standalone backend is running on port ${env.PORT}`);
});
