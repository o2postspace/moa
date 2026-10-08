import { configFromEnv, createApiServer } from './api.ts';

const config = configFromEnv(process.env);
const server = createApiServer({ config });
server.listen(config.port, config.host, () => {
  console.log(`핀맵 개발 API: http://localhost:${config.port} (loopback 전용)`);
});
server.on('error', () => {
  console.error('핀맵 API를 시작하지 못했습니다. 포트와 설정을 확인해 주세요.');
  process.exitCode = 1;
});
