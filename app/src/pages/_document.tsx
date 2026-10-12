import { Head, Html, Main, NextScript } from 'next/document';

const Document = () => (
  <Html lang="ko">
    <Head>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;
