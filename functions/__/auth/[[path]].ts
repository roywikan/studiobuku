// Cloudflare Pages Function: Proxy /__/auth/* to Firebase Auth Handler
export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const pathSuffix = url.pathname.replace('/__/auth', '');
  const targetUrl = `https://gen-lang-client-0987418952.firebaseapp.com/__/auth${pathSuffix}${url.search}`;

  const requestHeaders = new Headers(context.request.headers);
  requestHeaders.set("Host", "gen-lang-client-0987418952.firebaseapp.com");

  const modifiedRequest = new Request(targetUrl, {
    method: context.request.method,
    headers: requestHeaders,
    body: ["GET", "HEAD"].includes(context.request.method) ? null : context.request.body,
    redirect: "follow"
  });

  return fetch(modifiedRequest);
};
