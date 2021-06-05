!function(e){function t(i){if(r[i])return r[i].exports;var n=r[i]={exports:{},id:i,loaded:!1};return e[i].call(n.exports,n,n.exports,t),n.loaded=!0,n.exports}var r={};t.m=e,t.c=r,t.p="",t(0)}([function(e,t){if("undefined"==typeof AFRAME)throw new Error("Component attempted to register before AFRAME was available.");var r={childList:!0,attributes:!0,subtree:!0};AFRAME.registerComponent("aabb-collider",{schema:{collideNonVisible:{default:!1},debug:{default:!1},enabled:{default:!0},interval:{default:80},objects:{default:""}},init:function(){this.centerDifferenceVec3=new THREE.Vector3,this.clearedIntersectedEls=[],this.closestIntersectedEl=null,this.boundingBox=new THREE.Box3,this.boxCenter=new THREE.Vector3,this.boxHelper=new THREE.BoxHelper,this.boxMax=new THREE.Vector3,this.boxMin=new THREE.Vector3,this.hitClosestClearEventDetail={},this.hitClosestEventDetail={},this.intersectedEls=[],this.objectEls=[],this.newIntersectedEls=[],this.prevCheckTime=void 0,this.previousIntersectedEls=[],this.setDirty=this.setDirty.bind(this),this.observer=new MutationObserver(this.setDirty),this.dirty=!0,this.hitStartEventDetail={intersectedEls:this.newIntersectedEls}},play:function(){this.observer.observe(this.el.sceneEl,r),this.el.sceneEl.addEventListener("object3dset",this.setDirty),this.el.sceneEl.addEventListener("object3dremove",this.setDirty)},remove:function(){this.observer.disconnect(),this.el.sceneEl.removeEventListener("object3dset",this.setDirty),this.el.sceneEl.removeEventListener("object3dremove",this.setDirty)},tick:function(e){var t,r,i,n,s=this.boundingBox,o=this.centerDifferenceVec3,l=this.clearedIntersectedEls,c=this.intersectedEls,a=this.el,h=this.newIntersectedEls,d=this.objectEls,E=this.prevCheckTime,b=this.previousIntersectedEls;if(this.data.enabled&&!(E&&e-E<this.data.interval)){for(this.prevCheckTime=e,this.dirty&&this.refreshObjects(),s.setFromObject(a.object3D),this.boxMin.copy(s.min),this.boxMax.copy(s.max),s.getCenter(this.boxCenter),this.data.debug&&(this.boxHelper.setFromObject(a.object3D),this.boxHelper.parent||a.sceneEl.object3D.add(this.boxHelper)),function(e,t){var r;for(e.length=0,r=0;r<t.length;r++)e[r]=t[r]}(b,c),c.length=0,n=0;n<d.length;n++)d[n]!==this.el&&(this.data.collideNonVisible||d[n].getAttribute("visible")?this.isIntersecting(d[n])&&c.push(d[n]):this.data.debug&&(t=d[n].object3D.boxHelper)&&(a.sceneEl.object3D.remove(t),d[n].object3D.boxHelper=null));for(h.length=0,n=0;n<c.length;n++)-1===b.indexOf(c[n])&&h.push(c[n]);for(l.length=0,n=0;n<b.length;n++)-1===c.indexOf(b[n])&&(b[n].hasAttribute("aabb-collider")||b[n].emit("hitend"),l.push(b[n]));for(n=0;n<h.length;n++)h[n]!==this.el&&(h[n].hasAttribute("aabb-collider")||h[n].emit("hitstart"));for(n=0;n<c.length;n++)c[n]!==this.el&&(o.copy(c[n].object3D.boundingBoxCenter).sub(this.boxCenter),(void 0===r||o.length()<r)&&(r=o.length(),i=c[n]));!c.length&&this.closestIntersectedEl?(this.hitClosestClearEventDetail.el=this.closestIntersectedEl,this.closestIntersectedEl.emit("hitclosestclear"),this.closestIntersectedEl=null,a.emit("hitclosestclear",this.hitClosestClearEventDetail)):i!==this.closestIntersectedEl&&(this.closestIntersectedEl&&(this.hitClosestClearEventDetail.el=this.closestIntersectedEl,this.closestIntersectedEl.emit("hitclosestclear",this.hitClosestClearEventDetail)),i&&(i.emit("hitclosest"),this.closestIntersectedEl=i,this.hitClosestEventDetail.el=i,a.emit("hitclosest",this.hitClosestEventDetail))),l.length&&a.emit("hitend"),h.length&&a.emit("hitstart",this.hitStartEventDetail)}},isIntersecting:function(){var e=new THREE.Box3;return function(t){var r,i;return e.setFromObject(t.object3D),this.data.debug&&(t.object3D.boxHelper||(t.object3D.boxHelper=new THREE.BoxHelper(t.object3D,new THREE.Color(Math.random(),Math.random(),Math.random())),t.sceneEl.object3D.add(t.object3D.boxHelper)),t.object3D.boxHelper.setFromObject(t.object3D)),r=e.min,i=e.max,t.object3D.boundingBoxCenter=t.object3D.boundingBoxCenter||new THREE.Vector3,e.getCenter(t.object3D.boundingBoxCenter),this.boxMin.x<=i.x&&this.boxMax.x>=r.x&&this.boxMin.y<=i.y&&this.boxMax.y>=r.y&&this.boxMin.z<=i.z&&this.boxMax.z>=r.z}}(),setDirty:function(){this.dirty=!0},refreshObjects:function(){var e=this.data;this.objectEls=e.objects?this.el.sceneEl.querySelectorAll(e.objects):this.el.sceneEl.children,this.dirty=!1}})}]),AFRAME.registerComponent("portal",{schema:{destSelector:{default:""},width:{default:2},height:{default:3},maxRecursion:{default:2}},init:function(){var e=this.el,t=e.sceneEl,r=this.data;e.justTeleported=!1;var i=new THREE.BoxBufferGeometry(r.width,r.height,.01),n=new THREE.MeshBasicMaterial({colorWrite:!1}),s=new THREE.Mesh(i,n);if(s.geometry.computeBoundingSphere(),s.frustumCulled=!0,s.matrixAutoUpdate=!1,s.renderOrder=2,s.visible=!0,e.object3D.add(s),t.addEventListener("loaded",function(){var r=t.camera.el;r.id||(r.id="web-portal-cam-tag"),e.setAttribute("aabb-collider",{objects:"#"+r.id})}),t.addEventListener("portal-teleported",function(){e.justTeleported=!0}),e.addEventListener("hitstart",function(){if(!0!==e.justTeleported){t.emit("portal-teleported");var i=t.camera,n=i.el,s=document.querySelector(r.destSelector).object3D,o=e.object3D.rotation,l=s.rotation,c=new THREE.Euler(o.x-l.x,o.y-l.y,o.z-l.z);n.components["look-controls"]&&(n.components["look-controls"].yawObject.rotation.y+=c.y);var a=new THREE.Vector3;a.subVectors(i.getWorldPosition(new THREE.Vector3),e.object3D.getWorldPosition(new THREE.Vector3));var h=s.position.clone().add(a);i.el.object3D.position.x=h.x,i.el.object3D.position.y=h.y,i.el.object3D.position.z=h.z}}),t.portals||(t.portals=[],t.portalPairs=[]),!1===Array.from(t.children).reduce(function(e,t){return e||t.hasAttribute("portal-renderer")},!1)){var o=document.createElement("a-entity");o.setAttribute("portal-renderer",{maxRecursion:r.maxRecursion}),t.appendChild(o)}var l=t.portalPairs;t.portals.push(e.object3D);var c=document.querySelector(r.destSelector);if(c){var a=!1;l.forEach(function(t){t.forEach(function(t){t==e.object3D&&(a=!0)})}),0==a&&l.push([e.object3D,c.object3D])}},tick:function(){var e=this.el;!0===e.justTeleported&&setTimeout(function(){e.justTeleported=!1},100)}}),AFRAME.registerComponent("portal-renderer",{schema:{maxRecursion:{default:2}},init:function(){},tock:function(){this.renderRecursivePortals(this.el.sceneEl.renderer,this.el.sceneEl.camera,0)},renderRecursivePortals:function(e,t,r){var i=this,n=this.el.sceneEl,s=n.portals,o=n.portalPairs,l=e.getContext();e.autoClear=!1,t.matrixAutoUpdate=!1,o.forEach(function(o){o.forEach(function(c,a){var h=o[1-a],d=new THREE.Scene;d.children=c.children,l.colorMask(!1,!1,!1,!1),l.depthMask(!1),l.disable(l.DEPTH_TEST),l.enable(l.STENCIL_TEST),l.stencilFunc(l.NOTEQUAL,r,255),l.stencilOp(l.INCR,l.KEEP,l.KEEP),l.stencilMask(255),e.render(d,t);var E=(new THREE.PerspectiveCamera).copy(t);if(E.matrixWorld=function(e,t,r){var i=e.matrixWorld.clone();i.invert().multiply(t.matrixWorld);var n=r.matrixWorld.clone().invert(),s=(new THREE.Matrix4).makeRotationY(Math.PI);return(new THREE.Matrix4).multiply(i).multiply(s).multiply(n).invert()}(t,c,h),E.projectionMatrix=function(e,t,r){var i=t.clone().invert(),n=(new THREE.Matrix4).extractRotation(e.matrixWorld),s=(new THREE.Vector3).set(0,0,1).applyMatrix4(n),o=new THREE.Plane;o.setFromNormalAndCoplanarPoint(s,e.getWorldPosition(new THREE.Vector3)),o.applyMatrix4(i);var l=new THREE.Vector4;l.set(o.normal.x,o.normal.y,o.normal.z,o.constant);var c=r.clone(),a=new THREE.Vector4;return a.x=(Math.sign(l.x)+c.elements[8])/c.elements[0],a.y=(Math.sign(l.y)+c.elements[9])/c.elements[5],a.z=-1,a.w=(1+c.elements[10])/r.elements[14],l.multiplyScalar(2/l.dot(a)),c.elements[2]=l.x,c.elements[6]=l.y,c.elements[10]=l.z+1,c.elements[14]=l.w,c}(h,E.matrixWorld,E.projectionMatrix),r==i.data.maxRecursion){l.colorMask(!0,!0,!0,!0),l.depthMask(!0),e.clear(!1,!0,!1),l.enable(l.DEPTH_TEST),l.enable(l.STENCIL_TEST),l.stencilMask(0),l.stencilFunc(l.EQUAL,r+1,255),(new THREE.Scene).children=n.object3D.children.filter(function(e){return!s.includes(e)});var b=new THREE.Scene;b.children=n.object3D.children,e.render(b,E)}else i.renderRecursivePortals(e,E,r+1);l.colorMask(!1,!1,!1,!1),l.depthMask(!1),l.enable(l.STENCIL_TEST),l.stencilMask(255),l.stencilFunc(l.NOTEQUAL,r+1,255),l.stencilOp(l.DECR,l.KEEP,l.KEEP),e.render(d,t)})}),l.disable(l.STENCIL_TEST),l.stencilMask(0),l.colorMask(!1,!1,!1,!1),l.enable(l.DEPTH_TEST),l.depthMask(!0),l.depthFunc(l.ALWAYS),e.clear(!1,!0,!1),s.forEach(function(r){var i=new THREE.Scene;i.children=r.children,e.render(i,t)}),l.depthFunc(l.LESS),l.enable(l.STENCIL_TEST),l.stencilMask(0),l.stencilFunc(l.LEQUAL,r,255),l.colorMask(!0,!0,!0,!0),l.depthMask(!0),(new THREE.Scene).children=n.object3D.children;var c=new THREE.Scene;c.children=n.object3D.children,e.render(c,t),t.matrixAutoUpdate=!0}});
//# sourceMappingURL=aframe-portals.js.map
