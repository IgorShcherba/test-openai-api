import { useRef, useState } from "react";
import styles from "./index.module.css";

import { LoadingIndicator } from "../components/LoadingIndicator";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

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
          <h4>Course Summary:</h4>
          <ReactMarkdown>{result.courseSummary.data.content}</ReactMarkdown>
          {result.taglist && (
            <div>
              <h4>Tags</h4>
              <ul className={styles.tags}>
                {result.taglist.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {isLoading && <LoadingIndicator />}
    </main>
  );
}
