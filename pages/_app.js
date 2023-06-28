import Link from "next/link";
import styles from "./index.module.css";
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <ul className={styles.nav}>
        <li>
          <Link href="/">AI mentor</Link>
        </li>
        <li>
          <Link href="/links">AI Tag generation</Link>
        </li>
      </ul>
      <Component {...pageProps} />
    </>
  );
}
