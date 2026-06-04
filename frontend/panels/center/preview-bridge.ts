/** postMessage payloads between Dreamloom shell and injected preview bridge */
export type DreamloomPreviewConfigMessage = {
  type: "dreamloom:config";
  accentColor: string;
};

export type DreamloomPreviewClearMessage = {
  type: "dreamloom:clear";
};

export type DreamloomPreviewSelectMessage = {
  type: "dreamloom:select";
  dlClass: string;
  occurrenceIndex: number;
  tagName: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
};

export type DreamloomPreviewMessage =
  | DreamloomPreviewConfigMessage
  | DreamloomPreviewClearMessage
  | DreamloomPreviewSelectMessage;

export const PREVIEW_BRIDGE_PREFIX = "/__dreamloom_preview__";

/** Inline script injected into proxied HTML — runs inside the preview iframe */
export function previewBridgeScript(): string {
  return `(()=>{
var accent="#3B82F6";
var outlined=null;
function findDlClass(el){
  while(el&&el!==document.documentElement){
    if(el.classList){
      for(var i=0;i<el.classList.length;i++){
        var c=el.classList[i];
        if(/^dl-/.test(c))return{el:el,dlClass:c};
      }
    }
    el=el.parentElement;
  }
  return null;
}
function clearOutline(){
  if(outlined){outlined.style.outline="";outlined=null;}
}
function applyOutline(el){
  clearOutline();
  el.style.outline="2px solid "+accent;
  outlined=el;
}
window.addEventListener("message",function(e){
  var d=e.data;
  if(!d||d.type!=="dreamloom:config"||!d.accentColor)return;
  accent=d.accentColor;
  if(outlined)outlined.style.outline="2px solid "+accent;
});
function occurrenceIndex(el,dlClass){
  var all=document.getElementsByClassName(dlClass);
  for(var i=0;i<all.length;i++){if(all[i]===el)return i;}
  return 0;
}
document.addEventListener("click",function(e){
  var hit=findDlClass(e.target);
  if(!hit){
    clearOutline();
    parent.postMessage({type:"dreamloom:clear"},"*");
    return;
  }
  e.stopPropagation();
  applyOutline(hit.el);
  var r=hit.el.getBoundingClientRect();
  parent.postMessage({
    type:"dreamloom:select",
    dlClass:hit.dlClass,
    occurrenceIndex:occurrenceIndex(hit.el,hit.dlClass),
    tagName:hit.el.tagName,
    rect:{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,left:r.left,right:r.right,bottom:r.bottom}
  },"*");
},true);
})();`;
}

export function injectPreviewHead(html: string, port: number, script: string): string {
  const baseTag = `<base href="http://127.0.0.1:${port}/">`;
  const scriptTag = `<script>${script}</script>`;
  const inject = `${baseTag}${scriptTag}`;
  const lower = html.toLowerCase();
  const headClose = lower.indexOf("</head>");
  if (headClose !== -1) {
    return `${html.slice(0, headClose)}${inject}${html.slice(headClose)}`;
  }
  const bodyClose = lower.lastIndexOf("</body>");
  if (bodyClose !== -1) {
    return `${html.slice(0, bodyClose)}${inject}${html.slice(bodyClose)}`;
  }
  return `${html}${inject}`;
}
