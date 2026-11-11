export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      // povezava z žetonom naj ne uhaja drugam
      "referrer-policy": "no-referrer",
    },
  });
