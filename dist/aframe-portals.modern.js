AFRAME.registerComponent("portal",{schema:{destSelector:{default:""},width:{default:2},height:{default:3},maxRecursion:{default:2},teleportCooldown:{default:200}},init:function(){const e=this.el,t=e.sceneEl,n=this.data;e.justTeleported=!1;const o=new THREE.BoxBufferGeometry(n.width,n.height,.01),r=new THREE.MeshBasicMaterial({colorWrite:!1}),l=new THREE.Mesh(o,r);if(l.geometry.computeBoundingSphere(),l.frustumCulled=!0,l.matrixAutoUpdate=!1,l.renderOrder=2,l.visible=!0,l.name="portal-surface",e.object3D.add(l),t.addEventListener("portal-teleported",()=>{e.justTeleported=!0}),e.addEventListener("camera-collision",function(){if(!0===e.justTeleported)return;e.justTeleported=!0,t.emit("portal-teleported");const o=t.camera,r=o.el,l=document.querySelector(n.destSelector).object3D,c=e.object3D.rotation,a=l.rotation,i=new THREE.Euler(c.x-a.x,c.y-a.y,c.z-a.z);r.components["look-controls"]&&(r.components["look-controls"].yawObject.rotation.y+=i.y);const s=new THREE.Vector3;s.subVectors(o.getWorldPosition(new THREE.Vector3),e.object3D.getWorldPosition(new THREE.Vector3));const E=l.position.clone().add(s);o.el.object3D.position.x=E.x,o.el.object3D.position.y=E.y,o.el.object3D.position.z=E.z}),t.portals||(t.portals=[],t.portalPairs=[]),!1===Array.from(t.children).reduce((e,t)=>e||t.hasAttribute("portal-manager"),!1)){const e=document.createElement("a-entity");e.setAttribute("portal-manager",{maxRecursion:n.maxRecursion}),t.appendChild(e)}const c=t.portalPairs;t.portals.push(e.object3D);const a=document.querySelector(n.destSelector);if(a){let t=!1;c.forEach(n=>{n.forEach(n=>{n==e.object3D&&(t=!0)})}),0==t&&c.push([e.object3D,a.object3D])}},tick:function(){const e=this.el;!0===e.justTeleported&&setTimeout(()=>{e.justTeleported=!1},this.data.teleportCooldown)}}),AFRAME.registerComponent("portal-manager",{schema:{maxRecursion:{default:2}},init:function(){},tick:function(){const e=this.el.sceneEl,t=e.camera,n=e.portals.map(e=>{const t=e.children.filter(e=>"portal-surface"==e.name)[0],n=(new THREE.Box3).setFromObject(t);return{portal:e,xMin:n.min.x,xMax:n.max.x,yMin:n.min.y,yMax:n.max.y,zMin:n.min.z,zMax:n.max.z}}),o=t.getWorldPosition(new THREE.Vector3),r=o.x-.05,l=o.x+.05,c=o.y-.05,a=o.y+.05,i=o.z-.05,s=o.z+.05;n.forEach(e=>{r<=e.xMax&&l>=e.xMin&&c<=e.yMax&&a>=e.yMin&&i<=e.zMax&&s>=e.zMin&&(console.log("collision!"),e.portal.el.emit("camera-collision"))})},tock:function(){this.renderRecursivePortals(this.el.sceneEl.renderer,this.el.sceneEl.camera,0)},renderRecursivePortals:function(e,t,n){const o=this.el.sceneEl,r=o.portals,l=o.portalPairs,c=e.getContext();e.autoClear=!1,t.matrixAutoUpdate=!1,l.forEach(l=>{l.forEach((a,i)=>{const s=l[1-i],E=new THREE.Scene;E.children=a.children,c.colorMask(!1,!1,!1,!1),c.depthMask(!1),c.disable(c.DEPTH_TEST),c.enable(c.STENCIL_TEST),c.stencilFunc(c.NOTEQUAL,n,255),c.stencilOp(c.INCR,c.KEEP,c.KEEP),c.stencilMask(255),e.render(E,t);const d=(new THREE.PerspectiveCamera).copy(t);if(d.matrixWorld=function(e,t,n){const o=e.matrixWorld.clone();o.invert().multiply(t.matrixWorld);const r=n.matrixWorld.clone().invert(),l=(new THREE.Matrix4).makeRotationY(Math.PI);return(new THREE.Matrix4).multiply(o).multiply(l).multiply(r).invert()}(t,a,s),d.projectionMatrix=function(e,t,n){const o=t.clone().invert(),r=(new THREE.Matrix4).extractRotation(e.matrixWorld),l=(new THREE.Vector3).set(0,0,1).applyMatrix4(r),c=new THREE.Plane;c.setFromNormalAndCoplanarPoint(l,e.getWorldPosition(new THREE.Vector3)),c.applyMatrix4(o);const a=new THREE.Vector4;a.set(c.normal.x,c.normal.y,c.normal.z,c.constant);const i=n.clone(),s=new THREE.Vector4;return s.x=(Math.sign(a.x)+i.elements[8])/i.elements[0],s.y=(Math.sign(a.y)+i.elements[9])/i.elements[5],s.z=-1,s.w=(1+i.elements[10])/n.elements[14],a.multiplyScalar(2/a.dot(s)),i.elements[2]=a.x,i.elements[6]=a.y,i.elements[10]=a.z+1,i.elements[14]=a.w,i}(s,d.matrixWorld,d.projectionMatrix),n==this.data.maxRecursion){c.colorMask(!0,!0,!0,!0),c.depthMask(!0),e.clear(!1,!0,!1),c.enable(c.DEPTH_TEST),c.enable(c.STENCIL_TEST),c.stencilMask(0),c.stencilFunc(c.EQUAL,n+1,255),(new THREE.Scene).children=o.object3D.children.filter(e=>!r.includes(e));const t=new THREE.Scene;t.children=o.object3D.children,e.render(t,d)}else this.renderRecursivePortals(e,d,n+1);c.colorMask(!1,!1,!1,!1),c.depthMask(!1),c.enable(c.STENCIL_TEST),c.stencilMask(255),c.stencilFunc(c.NOTEQUAL,n+1,255),c.stencilOp(c.DECR,c.KEEP,c.KEEP),e.render(E,t)})}),c.disable(c.STENCIL_TEST),c.stencilMask(0),c.colorMask(!1,!1,!1,!1),c.enable(c.DEPTH_TEST),c.depthMask(!0),c.depthFunc(c.ALWAYS),e.clear(!1,!0,!1),r.forEach(n=>{const o=new THREE.Scene;o.children=n.children,e.render(o,t)}),c.depthFunc(c.LESS),c.enable(c.STENCIL_TEST),c.stencilMask(0),c.stencilFunc(c.LEQUAL,n,255),c.colorMask(!0,!0,!0,!0),c.depthMask(!0),(new THREE.Scene).children=o.object3D.children;const a=new THREE.Scene;a.children=o.object3D.children,e.render(a,t),t.matrixAutoUpdate=!0}});
//# sourceMappingURL=aframe-portals.modern.js.map
