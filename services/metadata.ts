const CLIENT_ID = process.env.UDEMY_CLIENT_ID;
const CLIENT_SECRET = process.env.UDEMY_CLIENT_SECRET;

const token = `${CLIENT_ID}:${CLIENT_SECRET}`;

const getCourseMetadata = (url: string) => {
  let parts = url.split("/");
  console.log(parts);
  let courseName = parts[parts.length - 2];
  console.log("hellowq", courseName);

  return fetch(
    `
  https://www.udemy.com/api-2.0/courses/${courseName}/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(token)}`,
      },
    }
  ).then((res) => {
    if (res.status != 200) {
      throw new Error("Something went wrong");
    }
    return res.json();
  });
};

const getCourseCurriculum = (courseId: number) => {
  return fetch(
    `https://www.udemy.com/api-2.0/courses/${courseId}/public-curriculum-items/?page=1&page_size=100`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(token)}`,
      },
    }
  ).then((res) => {
    if (res.status != 200) {
      throw new Error("Something went wrong");
    }
    return res.json().then((data) => {
      return data.results?.map(({ title, description }, i) => ({
        lection: i,
        title,
        description,
      }));
    });
  });
};

export const udemyService = {
  getCourseMetadata,
  getCourseCurriculum,
};
