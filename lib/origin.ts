/** Production accepts the configured public origin only. Development also accepts
 * a loopback origin when it is exactly the origin receiving the request. */
export function requestOriginAllowed(browserOrigin:string|null,requestURL:string,configuredURL:string,development:boolean,requestHost:string|null=null){
  if(!browserOrigin)return false;
  try{
    const browser=new URL(browserOrigin),configured=new URL(configuredURL),request=new URL(requestURL);
    if(browser.origin!==browserOrigin)return false;
    if(browser.origin===configured.origin)return true;
    const loopback=(hostname:string)=>['localhost','127.0.0.1','[::1]'].includes(hostname);
    // Next's development server can normalize req.url to localhost even when
    // the browser used 127.0.0.1. Host is the browser's receiving address.
    const sameAddress=requestHost!==null?browser.host===requestHost:browser.origin===request.origin;
    return development&&configured.protocol==='http:'&&browser.protocol==='http:'&&request.protocol==='http:'&&loopback(configured.hostname)&&loopback(browser.hostname)&&sameAddress;
  }catch{return false;}
}
