import { openAIService } from "../../services/openai";

export default async function (req, res) {
  console.log("link param", req.body);
  try {
    const result = await openAIService.generateTags(req.body.link);
    console.log("result", result);
    res.status(200).json({ result });
  } catch (error) {
    console.log(error?.response);
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
