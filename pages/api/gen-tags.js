import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { allSkillsString } from "../../services/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

const loader = new CheerioWebBaseLoader(
  "https://www.coursera.org/specializations/learn-sql-basics-data-science",
  { selector: "head title" }
);

const template =
  "Which of the technologies from the list: {allTags} are related to the provided text: {context}";

const prompt = new PromptTemplate({
  template: template,
  inputVariables: ["allTags", "context"],
});

const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo-0613",
  temperature: 0,
});

const chain = new LLMChain({ llm: model, prompt: prompt });

export default async function (req, res) {
  console.log("start");
  try {
    const docs = await loader.loadAndSplit();

    console.log(
      "docs",
      docs,
      docs.map((item) => item.pageContent)
      //   JSON.stringify(docs[0].pageContent, null, 3)
    );

    // const vectorStore = await MemoryVectorStore.fromTexts(
    //   docs.map((item) => item.pageContent),
    //   docs.map((_, i) => ({ id: i })),
    //   new OpenAIEmbeddings()
    // );

    // const similarity = await vectorStore.similaritySearch(allSkillsString, 1);
    // console.log(
    //   "similarity",
    //   similarity.map((item) => item.pageContent)
    // );
    // const result = await chain.call({
    //   allTags: allSkillsString,
    //   context: similarity.map((item) => item.pageContent).join(" "),
    // });

    console.log(result);
    res.status(200).json({ result: "ok" });
  } catch (error) {
    console.log(error);
    console.error(
      `Error with OpenAI API request: ${error.response?.data?.error?.message}`
    );
    res.status(500).json({
      error: {
        message:
          error?.response?.data?.error?.message ||
          "An error occurred during your request.",
      },
    });
  }
}
