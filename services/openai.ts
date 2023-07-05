import {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi,
} from "openai";
import { ALL_SKILLS, ALL_SKILLS_NORMALIZED } from "../data/skills";
import { linkPreviewService } from "./metadata";
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
  //   tagsFromAllSkillsDatase`tCount: tagsFromAllSkillsDataset.length,
  // });

  return {
    recommendation: recommendations,
    taglist: tagsFromAllSkillsDataset,
  };
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function parseMetadata(link) {
  try {
    const response = await linkPreviewService.getMetadata(link);

    return JSON.stringify({
      title: response.data.title,
      description: response.data.description,
      headline: response.data.headline,
    });
  } catch (error) {
    console.log("linkPreviewService error", JSON.stringify(error, null, 2));
  }
}

async function generateTags(url) {
  // Step 1: send the conversation and available functions to GPT
  let messages = [
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: `Parse its meta tags of a website:${url} and return only technologies from the list: ${JSON.stringify(
        ALL_SKILLS_NORMALIZED
      )} that are related to the webpage's title, description or headline. Return them in bullet list format`,
    },
  ];
  let functions = [
    {
      name: "parse_metadata",
      description: "Get the metadata of the given website",
      parameters: {
        type: "object",
        properties: {
          link: {
            type: "string",
            description: "URL of a website",
          },
        },
        required: ["link"],
      },
    },
  ];

  let response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    messages,
    functions: functions,
    function_call: "auto",
    temperature: 0.2,
  });

  let responseMessage = response.data.choices[0].message;

  // Step 2: check if GPT wanted to call a function
  if ("function_call" in responseMessage) {
    // Step 3: call the function
    let availableFunctions = {
      parse_metadata: parseMetadata,
    };

    let functionName = responseMessage.function_call.name;
    let functionToCall = availableFunctions[functionName];
    let functionArgs = JSON.parse(responseMessage.function_call.arguments);

    let functionResponse = await functionToCall(functionArgs.link);

    // Step 4: send the info on the function call and function response to GPT
    messages.push(responseMessage); // extend conversation with assistant's reply
    messages.push({
      role: ChatCompletionRequestMessageRoleEnum.Function,
      name: functionName,
      content: functionResponse,
    }); // extend conversation with function response

    let secondResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages,
      temperature: 0,
    }); // get a new response from GPT where it can see the function response

    let taglist = [];
    if (secondResponse.data.choices[0].message.function_call) {
      try {
        taglist = JSON.parse(
          secondResponse.data.choices[0].message.function_call.arguments
        ).tags;
      } catch (error) {
        console.log(error);
      }
      return { taglist };
    } else {
      return secondResponse.data.choices[0].message.content;
    }
  }
}

export const openAIService = { getSkillsSuggestions, generateTags };
