import { Head, Html, Main, NextScript } from 'next/document';
import { CLOUDFLARE_BEACON_SRC, cloudflareBeaconConfig } from '../lib/analytics';

const beaconConfig = cloudflareBeaconConfig(process.env.NEXT_PUBLIC_CF_BEACON_TOKEN, process.env.NODE_ENV);

const Document = () => (
  <Html lang="ko">
    <Head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
    <body>
      <Main />
      <NextScript />
      {beaconConfig ? <script defer src={CLOUDFLARE_BEACON_SRC} data-cf-beacon={beaconConfig} /> : null}
    </body>
  </Html>
);

export default Document;
