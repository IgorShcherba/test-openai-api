import { Configuration, OpenAIApi } from "openai";
import { ALL_SKILLS } from "../data/skills";
import { linkPreviewService } from "./metadata";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const allSkillsString = ALL_SKILLS.map((skill) => skill.name).join(", ");
const getSkillsSuggestions = async (currentSkills) => {
  // console.log(allSkillsString);
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    n: 1,
    messages: [
      {
        role: "system",
        content: "Act as a mentor for a software developer",
      },
      {
        role: "user",
        content: `I have a set of skills which include ${currentSkills}. What should I learn next?`,
      },
    ],
    temperature: 0.1,
    presence_penalty: 0,
    frequency_penalty: 0,
    // max_tokens: 400,
  });

  // console.log(normalizeResponse(completion.data.choices[0].message.content));
  const recommendations = completion.data.choices[0].message.content;

  const taglistResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    n: 1,
    messages: [
      {
        role: "user",
        content: `From the following recommendations:  ${recommendations}
        return a list of tags that directly match the recommendations or are related to them, considering the following list: ${allSkillsString}`,
      },
    ],
    functions: [
      {
        name: "renderTaglist",
        description: "Use this function to render a list of tags",
        parameters: {
          type: "object",
          properties: {
            taglist: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["taglist"],
        },
      },
    ],
    temperature: 0.1,
    presence_penalty: 0,
    frequency_penalty: 0,
    // max_tokens: 400,
  });
  console.log(taglistResponse.data.choices[0].message.function_call);
  let taglist = [];
  if (taglistResponse.data.choices[0].message.function_call) {
    try {
      taglist = JSON.parse(
        taglistResponse.data.choices[0].message.function_call.arguments
      ).taglist;
    } catch (error) {
      console.log(error);
    }
  }
  return { recommendation: recommendations, taglist };
};

async function parseMetadata(link) {
  try {
    const response = await linkPreviewService.getMetadata(link);
    console.log("linkPreviewService", response);
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
      role: "user",
      content: `Parse its meta tags of a website:${url} and return only technologies from the list: [${allSkillsString}] that are related to the webpage's title, description or headline. Return them in bullet list format`,
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
    messages: messages,
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
      role: "function",
      name: functionName,
      content: functionResponse,
    }); // extend conversation with function response

    let secondResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages,
      temperature: 0.2,
    }); // get a new response from GPT where it can see the function response
    console.log("secondResponse", secondResponse.data.choices[0].message);
    let taglist = [];
    if ("function_call" in secondResponse) {
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
