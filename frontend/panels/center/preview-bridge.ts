/** postMessage payloads between Dreamloom shell and injected preview bridge */
export type DreamloomPreviewConfigMessage = {
  type: "dreamloom:config";
  accentColor: string;
};

export type DreamloomPreviewClearMessage = {
  type: "dreamloom:clear";
};

export type PreviewDomTreeNode = {
  tagName: string;
  id?: string;
  dlClass?: string;
  /** Authored class tokens (svelte-* scope hashes and dl-* removed). */
  classes?: string[];
  children: PreviewDomTreeNode[];
};

export type DreamloomPreviewSelectMessage = {
  type: "dreamloom:select";
  dlClass: string;
  occurrenceIndex: number;
  tagName: string;
  rect: PreviewRect;
  tree: PreviewDomTreeNode;
  selectedPath: number[];
};

export type DreamloomPreviewSelectByIdMessage = {
  type: "dreamloom:selectById";
  id: string;
  tagName: string;
  rect: PreviewRect;
  tree: PreviewDomTreeNode;
  selectedPath: number[];
};

export type DreamloomPreviewChainUpdateMessage = {
  type: "dreamloom:chainUpdate";
  tree: PreviewDomTreeNode;
  selectedPath: number[];
};

/** A bare element (no dl-*, no id) was selected — eligible for dl-* injection. */
export type DreamloomPreviewSelectElementMessage = {
  type: "dreamloom:selectElement";
  tagName: string;
  classes: string[];
  occurrence: number;
  rect: PreviewRect;
  tree: PreviewDomTreeNode;
  selectedPath: number[];
};

export type DreamloomPreviewPickMessage = {
  type: "dreamloom:pick";
  path: number[];
};

export type DreamloomPreviewHighlightDlMessage = {
  type: "dreamloom:highlightDl";
  dlClass: string;
  occurrenceIndex: number;
};

type PreviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type DreamloomPreviewMessage =
  | DreamloomPreviewConfigMessage
  | DreamloomPreviewClearMessage
  | DreamloomPreviewSelectMessage
  | DreamloomPreviewSelectByIdMessage
  | DreamloomPreviewChainUpdateMessage
  | DreamloomPreviewSelectElementMessage
  | DreamloomPreviewPickMessage
  | DreamloomPreviewHighlightDlMessage;

export const PREVIEW_BRIDGE_PREFIX = "/__dreamloom_preview__";

/** Inline script injected into proxied HTML — runs inside the preview iframe */
export function previewBridgeScript(): string {
  return `(()=>{
var accent="#AACC00";
var OUTLINE_WIDTH=4;
var OUTLINE_OFFSET=6;
var outlined=null;
var lastTreeRoot=null;
var nodeCount=0;
var MAX_DEPTH=16;
var MAX_NODES=800;
var SKIP_TAGS={script:1,style:1};
function firstDlClass(el){
  if(!el||!el.classList)return null;
  for(var i=0;i<el.classList.length;i++){
    var c=el.classList[i];
    if(/^dl-/.test(c))return c;
  }
  return null;
}
function findDlClass(el){
  while(el&&el!==document.documentElement){
    var dl=firstDlClass(el);
    if(dl)return{el:el,dlClass:dl};
    el=el.parentElement;
  }
  return null;
}
function authoredClasses(el){
  var out=[];
  if(!el||!el.classList)return out;
  for(var i=0;i<el.classList.length;i++){
    var c=el.classList[i];
    if(/^svelte-/.test(c)||/^dl-/.test(c))continue;
    out.push(c);
  }
  return out;
}
function authoredKey(el){
  return authoredClasses(el).slice().sort().join(" ");
}
function signatureOccurrence(el){
  var all=document.getElementsByTagName(el.tagName);
  var key=authoredKey(el);
  var idx=0;
  for(var i=0;i<all.length;i++){
    if(all[i]===el)return idx;
    if(authoredKey(all[i])===key)idx++;
  }
  return idx;
}
function nodeInfo(el){
  var info={tagName:el.tagName.toLowerCase(),children:[]};
  if(el.id)info.id=el.id;
  var dl=firstDlClass(el);
  if(dl)info.dlClass=dl;
  info.classes=authoredClasses(el);
  return info;
}
function buildDomTree(el,depth){
  if(nodeCount>=MAX_NODES)return null;
  nodeCount++;
  var info=nodeInfo(el);
  var kids=[];
  if(depth<MAX_DEPTH){
    for(var i=0;i<el.children.length;i++){
      if(nodeCount>=MAX_NODES)break;
      var child=el.children[i];
      if(child.nodeType!==1)continue;
      var tag=child.tagName.toLowerCase();
      if(SKIP_TAGS[tag])continue;
      var built=buildDomTree(child,depth+1);
      if(built){
        info.children.push(built.node);
        kids.push(built);
      }
    }
  }
  return{node:info,el:el,kids:kids};
}
function findPath(built,target,path){
  if(built.el===target)return path;
  for(var i=0;i<built.kids.length;i++){
    var found=findPath(built.kids[i],target,path.concat(i));
    if(found)return found;
  }
  return null;
}
function resolvePath(built,path){
  if(!built)return null;
  var cur=built;
  for(var i=0;i<path.length;i++){
    cur=cur.kids[path[i]];
    if(!cur)return null;
  }
  return cur.el;
}
function rectOf(el){
  var r=el.getBoundingClientRect();
  return{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,left:r.left,right:r.right,bottom:r.bottom};
}
function outlineCss(){
  return OUTLINE_WIDTH+"px solid "+accent;
}
function clearOutline(){
  if(outlined){
    outlined.style.outline="";
    outlined.style.outlineOffset="";
    outlined=null;
  }
}
function applyOutline(el){
  clearOutline();
  el.style.outline=outlineCss();
  el.style.outlineOffset=OUTLINE_OFFSET+"px";
  outlined=el;
}
function occurrenceIndex(el,dlClass){
  var all=document.getElementsByClassName(dlClass);
  for(var i=0;i<all.length;i++){if(all[i]===el)return i;}
  return 0;
}
function postSelect(el,dlClass,tree,selectedPath){
  parent.postMessage({
    type:"dreamloom:select",
    dlClass:dlClass,
    occurrenceIndex:occurrenceIndex(el,dlClass),
    tagName:el.tagName,
    rect:rectOf(el),
    tree:tree,
    selectedPath:selectedPath
  },"*");
}
function postSelectById(el,tree,selectedPath){
  parent.postMessage({
    type:"dreamloom:selectById",
    id:el.id,
    tagName:el.tagName,
    rect:rectOf(el),
    tree:tree,
    selectedPath:selectedPath
  },"*");
}
function postSelectElement(el,tree,selectedPath){
  parent.postMessage({
    type:"dreamloom:selectElement",
    tagName:el.tagName.toLowerCase(),
    classes:authoredClasses(el),
    occurrence:signatureOccurrence(el),
    rect:rectOf(el),
    tree:tree,
    selectedPath:selectedPath
  },"*");
}
function pickAt(path){
  var el=resolvePath(lastTreeRoot,path);
  if(!el||!lastTreeRoot)return;
  var tree=lastTreeRoot.node;
  applyOutline(el);
  var dl=firstDlClass(el);
  if(dl){
    postSelect(el,dl,tree,path);
    return;
  }
  if(el.id){
    postSelectById(el,tree,path);
    return;
  }
  postSelectElement(el,tree,path);
}
window.addEventListener("message",function(e){
  var d=e.data;
  if(!d||!d.type)return;
  if(d.type==="dreamloom:config"&&d.accentColor){
    accent=d.accentColor;
    if(outlined){
      outlined.style.outline=outlineCss();
      outlined.style.outlineOffset=OUTLINE_OFFSET+"px";
    }
    return;
  }
  if(d.type==="dreamloom:pick"&&Array.isArray(d.path)){
    pickAt(d.path);
  }
  if(d.type==="dreamloom:highlightDl"&&d.dlClass){
    var nodes=document.getElementsByClassName(d.dlClass);
    var idx=typeof d.occurrenceIndex==="number"?d.occurrenceIndex:0;
    var el=nodes[idx]||nodes[0];
    if(el)applyOutline(el);
  }
});
document.addEventListener("click",function(e){
  nodeCount=0;
  var built=document.body?buildDomTree(document.body,0):null;
  if(!built){
    clearOutline();
    lastTreeRoot=null;
    parent.postMessage({type:"dreamloom:clear"},"*");
    return;
  }
  lastTreeRoot=built;

  // An element inside an existing dl-* element still selects that dl element.
  var hit=findDlClass(e.target);
  if(hit){
    e.stopPropagation();
    var dlPath=findPath(built,hit.el,[])||[];
    applyOutline(hit.el);
    postSelect(hit.el,hit.dlClass,built.node,dlPath);
    return;
  }

  // No dl-* ancestor: select the exact clicked element (bare or id).
  var target=e.target;
  if(!target||!target.tagName||target===document.documentElement||target===document.body){
    clearOutline();
    parent.postMessage({type:"dreamloom:clear"},"*");
    return;
  }
  e.stopPropagation();
  var path=findPath(built,target,[])||[];
  applyOutline(target);
  if(target.id){
    postSelectById(target,built.node,path);
  }else{
    postSelectElement(target,built.node,path);
  }
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
