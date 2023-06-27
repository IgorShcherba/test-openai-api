import { Configuration, OpenAIApi } from "openai";
import { ALL_SKILLS } from "../data/skills";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getSkillsSuggestions = async (currentSkills) => {
  const allSkillsString = ALL_SKILLS.map((skill) => skill.name).join(", ");
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

export const openAIService = { getSkillsSuggestions };
