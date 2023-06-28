const getMetadata = (url) => {
  const data = {
    url,
    device: "desktop",
  };
  return fetch("https://api.geekflare.com/metascraping", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.LINK_PREVIEW_API_KEY,
    },
    body: JSON.stringify(data),
  }).then((res) => {
    if (res.status != 200) {
      console.log(res.status);
      throw new Error("Something went wrong");
    }
    return res.json();
  });
};

export const linkPreviewService = {
  getMetadata,
};
