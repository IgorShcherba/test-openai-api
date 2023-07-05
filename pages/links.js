import Head from "next/head";
import { useRef, useState } from "react";
import styles from "./index.module.css";
import ReactMarkdown from "react-markdown";
import { LoadingIndicator } from "../components/LoadingIndicator";

export default function Links() {
  const [result, setResult] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef();

  const getTaglist = async (link) => {
    setIsLoading(true);
    const response = await fetch("/api/generate-tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ link }),
    });

    const data = await response.json();
    console.log("data", data);
    setResult(data.result);
    setIsLoading(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await getTaglist(inputRef.current.value);
  };

  return (
    <main className={styles.main}>
      <div className={styles.formContainer}>
        <h3 style={{ maxWidth: 400 }}>Tags Generation</h3>
        <form onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="text"
            name="link"
            placeholder="Enter a link"
          />

          <button type="submit">Generate taglist</button>
        </form>
      </div>

      {result && !isLoading && (
        <div className={styles.responseContainer}>
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
      {isLoading && <LoadingIndicator />}
    </main>
  );
}
