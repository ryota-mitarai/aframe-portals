!function(e){function t(i){if(s[i])return s[i].exports;var n=s[i]={exports:{},id:i,loaded:!1};return e[i].call(n.exports,n,n.exports,t),n.loaded=!0,n.exports}var s={};t.m=e,t.c=s,t.p="",t(0)}([function(e,t){if("undefined"==typeof AFRAME)throw new Error("Component attempted to register before AFRAME was available.");var s={childList:!0,attributes:!0,subtree:!0};AFRAME.registerComponent("aabb-collider",{schema:{collideNonVisible:{default:!1},debug:{default:!1},enabled:{default:!0},interval:{default:80},objects:{default:""}},init:function(){this.centerDifferenceVec3=new THREE.Vector3,this.clearedIntersectedEls=[],this.closestIntersectedEl=null,this.boundingBox=new THREE.Box3,this.boxCenter=new THREE.Vector3,this.boxHelper=new THREE.BoxHelper,this.boxMax=new THREE.Vector3,this.boxMin=new THREE.Vector3,this.hitClosestClearEventDetail={},this.hitClosestEventDetail={},this.intersectedEls=[],this.objectEls=[],this.newIntersectedEls=[],this.prevCheckTime=void 0,this.previousIntersectedEls=[],this.setDirty=this.setDirty.bind(this),this.observer=new MutationObserver(this.setDirty),this.dirty=!0,this.hitStartEventDetail={intersectedEls:this.newIntersectedEls}},play:function(){this.observer.observe(this.el.sceneEl,s),this.el.sceneEl.addEventListener("object3dset",this.setDirty),this.el.sceneEl.addEventListener("object3dremove",this.setDirty)},remove:function(){this.observer.disconnect(),this.el.sceneEl.removeEventListener("object3dset",this.setDirty),this.el.sceneEl.removeEventListener("object3dremove",this.setDirty)},tick:function(e){var t,s,i,n,r=this.boundingBox,o=this.centerDifferenceVec3,l=this.clearedIntersectedEls,c=this.intersectedEls,a=this.el,h=this.newIntersectedEls,d=this.objectEls,E=this.prevCheckTime,b=this.previousIntersectedEls;if(this.data.enabled&&!(E&&e-E<this.data.interval)){for(this.prevCheckTime=e,this.dirty&&this.refreshObjects(),r.setFromObject(a.object3D),this.boxMin.copy(r.min),this.boxMax.copy(r.max),r.getCenter(this.boxCenter),this.data.debug&&(this.boxHelper.setFromObject(a.object3D),this.boxHelper.parent||a.sceneEl.object3D.add(this.boxHelper)),function(e,t){var s;for(e.length=0,s=0;s<t.length;s++)e[s]=t[s]}(b,c),c.length=0,n=0;n<d.length;n++)d[n]!==this.el&&(this.data.collideNonVisible||d[n].getAttribute("visible")?this.isIntersecting(d[n])&&c.push(d[n]):this.data.debug&&(t=d[n].object3D.boxHelper)&&(a.sceneEl.object3D.remove(t),d[n].object3D.boxHelper=null));for(h.length=0,n=0;n<c.length;n++)-1===b.indexOf(c[n])&&h.push(c[n]);for(l.length=0,n=0;n<b.length;n++)-1===c.indexOf(b[n])&&(b[n].hasAttribute("aabb-collider")||b[n].emit("hitend"),l.push(b[n]));for(n=0;n<h.length;n++)h[n]!==this.el&&(h[n].hasAttribute("aabb-collider")||h[n].emit("hitstart"));for(n=0;n<c.length;n++)c[n]!==this.el&&(o.copy(c[n].object3D.boundingBoxCenter).sub(this.boxCenter),(void 0===s||o.length()<s)&&(s=o.length(),i=c[n]));!c.length&&this.closestIntersectedEl?(this.hitClosestClearEventDetail.el=this.closestIntersectedEl,this.closestIntersectedEl.emit("hitclosestclear"),this.closestIntersectedEl=null,a.emit("hitclosestclear",this.hitClosestClearEventDetail)):i!==this.closestIntersectedEl&&(this.closestIntersectedEl&&(this.hitClosestClearEventDetail.el=this.closestIntersectedEl,this.closestIntersectedEl.emit("hitclosestclear",this.hitClosestClearEventDetail)),i&&(i.emit("hitclosest"),this.closestIntersectedEl=i,this.hitClosestEventDetail.el=i,a.emit("hitclosest",this.hitClosestEventDetail))),l.length&&a.emit("hitend"),h.length&&a.emit("hitstart",this.hitStartEventDetail)}},isIntersecting:function(){var e=new THREE.Box3;return function(t){var s,i;return e.setFromObject(t.object3D),this.data.debug&&(t.object3D.boxHelper||(t.object3D.boxHelper=new THREE.BoxHelper(t.object3D,new THREE.Color(Math.random(),Math.random(),Math.random())),t.sceneEl.object3D.add(t.object3D.boxHelper)),t.object3D.boxHelper.setFromObject(t.object3D)),s=e.min,i=e.max,t.object3D.boundingBoxCenter=t.object3D.boundingBoxCenter||new THREE.Vector3,e.getCenter(t.object3D.boundingBoxCenter),this.boxMin.x<=i.x&&this.boxMax.x>=s.x&&this.boxMin.y<=i.y&&this.boxMax.y>=s.y&&this.boxMin.z<=i.z&&this.boxMax.z>=s.z}}(),setDirty:function(){this.dirty=!0},refreshObjects:function(){var e=this.data;this.objectEls=e.objects?this.el.sceneEl.querySelectorAll(e.objects):this.el.sceneEl.children,this.dirty=!1}})}]),AFRAME.registerComponent("portal",{schema:{destSelector:{default:""},width:{default:2},height:{default:3},maxRecursion:{default:2}},init:function(){const e=this.el,t=e.sceneEl,s=this.data;e.setAttribute("visible",!1);const i=new THREE.BoxBufferGeometry(s.width,s.height,.01),n=new THREE.MeshBasicMaterial({colorWrite:!1}),r=new THREE.Mesh(i,n);r.geometry.computeBoundingSphere(),r.frustumCulled=!0,r.matrixAutoUpdate=!1,r.renderOrder=2,r.visible=!0,e.object3D.add(r),t.addEventListener("loaded",()=>{const s=t.camera.el;s.id||(s.id="web-portal-cam-tag"),e.setAttribute("aabb-collider",{objects:`#${s.id}`})}),e.addEventListener("hitstart",function(){}),t.portals||(t.portals=[],t.portalPairs=[],t.object3D.onAfterRender=(e,t,s)=>{this.renderRecursivePortals(e,s)});const o=t.portalPairs;t.portals.push(e.object3D);const l=document.querySelector(s.destSelector);if(l){let t=!1;o.forEach(s=>{s.forEach(s=>{s==e.object3D&&(t=!0)})}),0==t&&o.push([e.object3D,l.object3D])}},tick:function(){},renderRecursivePortals:function(e,t,s=0){const i=this.el.sceneEl,n=i.portals,r=i.portalPairs,o=e.getContext();e.autoClear=!1,t.matrixAutoUpdate=!1,r.forEach(r=>{r.forEach((l,c)=>{const a=r[1-c],h=new THREE.Scene;h.children=l.children,o.colorMask(!1,!1,!1,!1),o.depthMask(!1),o.disable(o.DEPTH_TEST),o.enable(o.STENCIL_TEST),o.stencilFunc(o.NOTEQUAL,s,255),o.stencilOp(o.INCR,o.KEEP,o.KEEP),o.stencilMask(255),e.render(h,t);const d=(new THREE.PerspectiveCamera).copy(t);if(d.matrixWorld=function(e,t,s){const i=e.matrixWorld.clone();i.invert().multiply(t.matrixWorld);const n=s.matrixWorld.clone().invert(),r=(new THREE.Matrix4).makeRotationY(Math.PI);return(new THREE.Matrix4).multiply(i).multiply(r).multiply(n).invert()}(t,l,a),d.projectionMatrix=function(e,t,s){const i=t.clone().invert(),n=(new THREE.Matrix4).extractRotation(e.matrixWorld),r=(new THREE.Vector3).set(0,0,1).applyMatrix4(n),o=new THREE.Plane;o.setFromNormalAndCoplanarPoint(r,e.getWorldPosition(new THREE.Vector3)),o.applyMatrix4(i);const l=new THREE.Vector4;l.set(o.normal.x,o.normal.y,o.normal.z,o.constant);const c=s.clone(),a=new THREE.Vector4;return a.x=(Math.sign(l.x)+c.elements[8])/c.elements[0],a.y=(Math.sign(l.y)+c.elements[9])/c.elements[5],a.z=-1,a.w=(1+c.elements[10])/s.elements[14],l.multiplyScalar(2/l.dot(a)),c.elements[2]=l.x,c.elements[6]=l.y,c.elements[10]=l.z+1,c.elements[14]=l.w,c}(a,d.matrixWorld,d.projectionMatrix),s==this.data.maxRecursion){o.colorMask(!0,!0,!0,!0),o.depthMask(!0),e.clear(!1,!0,!1),o.enable(o.DEPTH_TEST),o.enable(o.STENCIL_TEST),o.stencilMask(0),o.stencilFunc(o.EQUAL,s+1,255),(new THREE.Scene).children=i.object3D.children.filter(e=>!n.includes(e));const t=new THREE.Scene;t.children=i.object3D.children,e.render(t,d)}else this.renderRecursivePortals(e,d,s+1);o.colorMask(!1,!1,!1,!1),o.depthMask(!1),o.enable(o.STENCIL_TEST),o.stencilMask(255),o.stencilFunc(o.NOTEQUAL,s+1,255),o.stencilOp(o.DECR,o.KEEP,o.KEEP),e.render(h,t)})}),o.disable(o.STENCIL_TEST),o.stencilMask(0),o.colorMask(!1,!1,!1,!1),o.enable(o.DEPTH_TEST),o.depthMask(!0),o.depthFunc(o.ALWAYS),e.clear(!1,!0,!1),n.forEach(s=>{const i=new THREE.Scene;i.children=s.children,e.render(i,t)}),o.depthFunc(o.LESS),o.enable(o.STENCIL_TEST),o.stencilMask(0),o.stencilFunc(o.LEQUAL,s,255),o.colorMask(!0,!0,!0,!0),o.depthMask(!0),(new THREE.Scene).children=i.object3D.children;const l=new THREE.Scene;l.children=i.object3D.children,e.render(l,t),t.matrixAutoUpdate=!0}});
//# sourceMappingURL=aframe-portals.modern.js.map