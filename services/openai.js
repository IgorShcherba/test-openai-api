import { Configuration, OpenAIApi } from "openai";
import { ALL_SKILLS } from "../data/skills";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getSkillsSuggestions = async (currentSkills, specification) => {
  const allSkillsString = ALL_SKILLS.map((skill) => skill.name).join(", ");

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    n: 1,
    messages: [
      {
        role: "system",
        content: "Act as an AI mentor for a software developer",
      },
      {
        role: "user",
        content: `The desirable area/specialization is: ${specification}.
          \nSuggest what should they learn next based on the natural progression from the existing skills.
          \nRender suggested list into UI as html.
          If an already acquired skill implies knowing the suggested (like e.g. Nextjs and React) - suggested should be excluded from the response. 
          \nExclude skills that is already in the list of available ones: \n***available skills: ${currentSkills}***
          \nSuggested list should be a subset of All skills provided below, where strictly one entry from it should represent an item of the suggested list: \n***All skills: ${allSkillsString}***`,
      },
    ],
    functions: [
      {
        name: "renderSuggestions",
        description:
          "Use this function to render suggested skills and explanations of why they were chosen in UI as html tags",
        parameters: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                description: "Suggested skill",
                properties: {
                  title: {
                    type: "string",
                    description:
                      "Title of the suggested skill, should be in the list of all skills provided in the question",
                  },
                  description: {
                    type: "string",
                    description:
                      "A short description (of maximum 200 characters long) of a skill",
                  },
                },
              },
              description:
                "An array with 5 items, each element of which is a suggested skill for improvement",
            },
          },
          required: ["suggestions"],
        },
      },
    ],
    temperature: 0.1,
    presence_penalty: 0,
    frequency_penalty: 0,
    max_tokens: 400,
  });

  return normalizeResponse(completion);
};

const getFieldsSuggestions = async (currentSkills) => {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    n: 1,
    messages: [
      {
        role: "system",
        content: "Act as an AI mentor for a software developer",
      },
      {
        role: "user",
        content: `Based on the skillset of a mentee provided below, render a list of 3 possible specializations (e.g. Fontend, Backend, DevOps, QA engineer and others.):\n${currentSkills}`,
      },
    ],
    functions: [
      {
        name: "renderSpecializations",
        description:
          "Use this function to render list of specializations in UI as html tags",
        parameters: {
          type: "object",
          properties: {
            specializations: {
              type: "array",
              items: {
                type: "string",
                description: "Specialization title",
              },
              description:
                "An array where each element is a unique string representing a specialization",
            },
          },
          required: ["specializations"],
        },
      },
    ],
    temperature: 0.1,
    presence_penalty: 0,
    frequency_penalty: 0,
    max_tokens: 256,
  });

  return normalizeResponse(completion);
};

const normalizeResponse = (response) => {
  let data = {};

  if (response.data.choices[0].message.function_call) {
    try {
      data = JSON.parse(
        response.data.choices[0].message.function_call?.arguments
      );
    } catch (error) {
      console.log("error parsing arguments", error);
      throw error;
    }
  } else {
    data = [response.data.choices[0].message.content];
  }

  return data;
};

export const openAIService = { getSkillsSuggestions, getFieldsSuggestions };
