interface Env { API:Fetcher }
export const onRequest:PagesFunction<Env>=async({request,env})=>{
  if(!env.API)return Response.json({error:'API service binding is missing.'},{status:503});
  const headers=new Headers(request.headers);
  headers.set('x-forwarded-for',request.headers.get('cf-connecting-ip')||'unknown');
  return env.API.fetch(new Request(request,{headers}));
};
