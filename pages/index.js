import Head from "next/head";
import { useRef, useState } from "react";
import styles from "./index.module.css";
import ReactMarkdown from "react-markdown";
import { mySkills } from "../data/skills";
import { LoadingIndicator } from "../components/LoadingIndicator";

export default function Home() {
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState();

  async function onSubmit(event) {
    if (isLoading) return;
    event.preventDefault();

    setResult(null);
    const skills = inputRef.current.value;

    try {
      setIsLoading(true);

      const response = await fetch("/api/suggest-skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skills,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }

      setResult(data.result);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }
  console.log(result);
  return (
    <div>
      <Head>
        <title>OpenAI mentor</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <div className={styles.formContainer}>
          <h3>Based on my skills: </h3>

          <form onSubmit={onSubmit}>
            <textarea
              rows={10}
              defaultValue={mySkills.map((skill) => skill.skillName).join(", ")}
              ref={inputRef}
              type="text"
              name="skills"
              placeholder="Enter a comma-separated list of skills"
            />

            <h3>What would you suggest to learn next? </h3>

            <button type="submit">Generate answer</button>
          </form>
        </div>

        {result && !isLoading && (
          <div className={styles.responseContainer}>
            <h4>Recommendations</h4>
            <ReactMarkdown>{result.recommendation}</ReactMarkdown>
          </div>
        )}
        {result?.taglist && (
          <div>
            <h4>Tags</h4>
            <ul className={styles.tags}>
              {result.taglist.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        )}
        {isLoading && <LoadingIndicator />}
      </main>
    </div>
  );
}
