import type { AppProps } from "next/app";
import Head from "next/head";
import { useI18n } from "@/lib/store";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const { t } = useI18n();
  return <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <title>{t("meta.title")}</title>
      <meta name="description" content={t("meta.desc")} />
    </Head>
    <Component {...pageProps} />
  </>;
}
