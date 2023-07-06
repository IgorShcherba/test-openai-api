import { ALL_SKILLS_NORMALIZED } from "../data/skills";

import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  HumanChatMessage,
  SystemChatMessage,
  AIChatMessage,
} from "langchain/schema";

function parseBulletListResponse(response: string): string[] {
  return response
    .split("\n")
    .filter((item) => item.includes("-"))
    .map((item) => item.replace(/^- /, ""));
}

function extractTechnologies(data: string[]): string[] {
  const technologiesMap = new Map(
    ALL_SKILLS_NORMALIZED.map((tech) => [tech.toLowerCase(), tech])
  );
  const extractedTechnologies: Set<string> = new Set();

  data.forEach((tag) => {
    technologiesMap.forEach((originalTech, lowerCaseTech) => {
      const regex = new RegExp(
        `\\b${lowerCaseTech.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
        "i"
      );
      if (regex.test(tag)) {
        extractedTechnologies.add(originalTech);
      }
    });
  });

  return Array.from(extractedTechnologies);
}

const chat = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-0613",
  temperature: 0,
  maxTokens: 400,
  topP: 0,
  frequencyPenalty: 0,
  presencePenalty: 0,
});

const systemMessage = new SystemChatMessage(
  "Act as a mentor for a software developer"
);

const getSkillsSuggestions = async (currentSkills) => {
  const suggestSkillsPrompt = new HumanChatMessage(
    `I have a set of skills which include ${currentSkills}. What should I learn next?`
  );
  const extractTagsPrompt = new HumanChatMessage(
    `return only those items from the list provided below that are related to or directly mentioned in the suggestions: 
      \n ${JSON.stringify(ALL_SKILLS_NORMALIZED)}`
  );

  const completion = await chat.call([systemMessage, suggestSkillsPrompt]);

  const recommendations = completion.text;
  const aiResponse = new AIChatMessage(recommendations);

  const taglistResponses = await chat.call([
    suggestSkillsPrompt,
    aiResponse,
    extractTagsPrompt,
  ]);

  const taglist = parseBulletListResponse(taglistResponses.text);

  const tagsFromAllSkillsDataset = extractTechnologies(taglist);
  console.log(taglistResponses);

  // console.log({
  //   taglist,
  //   tagsExtracted: taglist.length,
  //   tagsFromAllSkillsDataset,
  //   tagsFromAllSkillsDatasetCount: tagsFromAllSkillsDataset.length,
  // });

  return {
    recommendation: recommendations,
    taglist: tagsFromAllSkillsDataset,
  };
};

const chat2 = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-0613",
  temperature: 0,
  maxTokens: 1000,
  topP: 0,
  frequencyPenalty: 0,
  presencePenalty: 0,
});

async function generateTags(title: string, curriculum: any[]) {
  console.log(JSON.stringify(curriculum.map((item) => item.title).join("\n")));

  const summarizeCourcePrompt = new HumanChatMessage(
    `Provide a short summary (2 sentences long) of the main subject matter based on the course curriculum below:
    \n Title: ${title}
    \n Curriculum: ${JSON.stringify(
      curriculum.map((item, i) => `${i}.${item.title}`).join("\n")
    )}`
  );

  const summarizeCourcePrompt1 = new HumanChatMessage(
    `Provide a short summary (2 sentences long) of the main subject matter based on the course curriculum below:
    \n Title: ${title}`
  );
  const completion1 = await chat2.call([summarizeCourcePrompt]);
  const courceSummary = new AIChatMessage(completion1.text);
  console.log("summary", courceSummary);
  const extractTagsPrompt = new HumanChatMessage(
    `return as a bullet list only those items from the list provided below that are related to the course summary
    \n ${JSON.stringify(ALL_SKILLS_NORMALIZED)}`
  );
  const completion2 = await chat2.call([courceSummary, extractTagsPrompt]);
  console.log(completion2);
  const taglist = parseBulletListResponse(completion2.text);
  const tagsFromAllSkillsDataset = extractTechnologies(taglist);

  console.log({
    taglist,
    tagsExtracted: taglist.length,
    tagsFromAllSkillsDataset,
    tagsFromAllSkillsDatasetCount: tagsFromAllSkillsDataset.length,
  });

  return { taglist: tagsFromAllSkillsDataset, courseSummary: completion1 };
}

export const openAIService = { getSkillsSuggestions, generateTags };
