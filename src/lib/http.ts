export function json(data: unknown, init: number | ResponseInit = 200) {
  const initObj = typeof init === "number" ? { status: init } : init;
  return new Response(JSON.stringify(data), {
    ...initObj,
    headers: { "content-type": "application/json", ...(initObj as any)?.headers },
  });
}

export function badRequest(msg = "Bad Request") { return json({ error: msg }, 400); }
export function notFound(msg = "Not Found") { return json({ error: msg }, 404); }
export function serverError(e: unknown) {
  console.error(e);
  return json({ error: "Internal Server Error" }, 500);
}