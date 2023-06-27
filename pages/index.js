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
  const [preferredSpec, setPreferredSpec] = useState(null);
  const [specializations, setSpecializations] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    setPreferredSpec(null);
    setResult(null);
    const skills = inputRef.current.value;

    if (!skills) {
      alert("Enter your skills");

      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/suggest-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skills }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }

      setSpecializations(data.result.specializations);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Head>
        <title>OpenAI mentor</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <div className={styles.formContainer}>
          <h3>These are my skills: </h3>

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

        {!result && specializations?.length && !isLoading && (
          <div>
            <h4>Click on your preferred specialization</h4>
            <ul>
              {specializations.map((item) => (
                <li
                  className={styles.specialization}
                  key={item}
                  onClick={async () => {
                    const skills = inputRef.current.value;
                    setPreferredSpec(item);
                    try {
                      setIsLoading(true);

                      const response = await fetch("/api/suggest-skills", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          skills,
                          specialization: item,
                        }),
                      });

                      const data = await response.json();
                      if (response.status !== 200) {
                        throw (
                          data.error ||
                          new Error(
                            `Request failed with status ${response.status}`
                          )
                        );
                      }

                      setResult(data.result.suggestions);
                    } catch (error) {
                      console.error(error);
                      alert(error.message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && preferredSpec && !isLoading && (
          <div className={styles.responseContainer}>
            <h4>
              Based on your existing knowledge, here are 5 skills
              <br /> you can learn to excel even more in {preferredSpec}
            </h4>
            <ol>
              {result.map((item) => (
                <li key={item}>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
        {isLoading && <LoadingIndicator />}
      </main>
    </div>
  );
}
