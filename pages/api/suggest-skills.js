import { openAIService } from "../../services/openai";

export default async function (req, res) {
  const skills = req.body.skills || "";
  if (skills.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter skills",
      },
    });
    return;
  }
  const specialization = req.body.specialization || "";

  if (specialization.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please select specialization",
      },
    });
    return;
  }

  try {
    const result = await openAIService.getSkillsSuggestions(
      skills,
      specialization
    );

    res.status(200).json({ result });
  } catch (error) {
    console.log(error);
    console.error(`Error with OpenAI API request: ${error.message}`);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
